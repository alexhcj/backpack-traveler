-- Generated 2026-11-16. Dry-run verified against project hzibisccskwlwouszepc (applied in a
-- transaction + end-to-end checks + rollback). Apply with: supabase db push, or the
-- Supabase MCP apply_migration tool, or paste into the SQL editor.

-- =====================================================================
-- Books mini shop: cart, guest carts, login merge, checkout (stock is
-- reserved only when an order is placed).
--
-- Model
--   * Browser/server never touch carts/cart_items/orders tables directly.
--     All writes go through SECURITY DEFINER RPCs below, called with the
--     publishable key. Logged-in user = auth.uid(); guest = opaque
--     session id from an httpOnly cookie (passed as p_session_id).
--   * One active cart per user / per guest session (carts.status).
--   * Stock (books.quantity) is checked on add/update and decremented
--     atomically in place_order(). Nothing is reserved before that.
--
-- Safe to run on the current DB: carts / cart_items / orders are empty.
-- =====================================================================

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 1. carts: explicit status instead of expires_at
-- ---------------------------------------------------------------------
drop index if exists public.unique_active_cart_user;
drop index if exists public.unique_active_cart_session;
drop index if exists public.idx_carts_expires_at;
alter table public.carts drop column if exists expires_at;

alter table public.carts
  add column if not exists status text not null default 'active'
  check (status in ('active', 'converted'));

create unique index if not exists carts_one_active_per_user
  on public.carts (user_id) where status = 'active' and user_id is not null;
create unique index if not exists carts_one_active_per_session
  on public.carts (session_id) where status = 'active' and session_id is not null;

-- ---------------------------------------------------------------------
-- 2. orders: guest checkout, totals, order key; order_items snapshot
-- ---------------------------------------------------------------------
alter table public.orders drop constraint if exists orders_cart_id_fkey;
alter table public.orders alter column cart_id drop not null;
alter table public.orders
  add constraint orders_cart_id_fkey foreign key (cart_id)
  references public.carts (id) on delete set null;

alter table public.orders
  add column if not exists order_number bigint generated always as identity,
  add column if not exists order_key uuid not null default gen_random_uuid(),
  add column if not exists email text not null,
  add column if not exists billing_address jsonb not null default '{}'::jsonb,
  add column if not exists payment_method text not null default 'cod',
  add column if not exists customer_note text,
  add column if not exists subtotal numeric not null default 0 check (subtotal >= 0),
  add column if not exists shipping_total numeric not null default 0 check (shipping_total >= 0);
alter table public.orders alter column shipping_address set default '{}'::jsonb;
create unique index if not exists orders_order_number_key on public.orders (order_number);
create unique index if not exists orders_order_key_key on public.orders (order_key);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  book_id uuid references public.books (id) on delete set null,
  title text not null,
  unit_price numeric not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total numeric generated always as (unit_price * quantity) stored,
  created_at timestamptz not null default now()
);
create index if not exists idx_order_items_order_id on public.order_items (order_id);

-- ---------------------------------------------------------------------
-- 3. Access: no direct table access for carts/cart_items/orders writes
-- ---------------------------------------------------------------------
drop policy if exists "Enable users to view their own data only" on public.carts;
drop policy if exists "Users can create carts" on public.carts;
drop policy if exists "Users can delete their own carts" on public.carts;
drop policy if exists "Users can update their own carts" on public.carts;
drop policy if exists "Users can view their own carts" on public.carts;
drop policy if exists "Users can add items to their carts" on public.cart_items;
drop policy if exists "Users can delete items from their carts" on public.cart_items;
drop policy if exists "Users can update items in their carts" on public.cart_items;
drop policy if exists "Users can view items in their carts" on public.cart_items;
drop policy if exists "Users can create orders" on public.orders;

revoke all on public.carts, public.cart_items from anon, authenticated;
revoke all on public.orders, public.order_items from anon;
revoke insert, update, delete, truncate, references, trigger
  on public.orders, public.order_items from authenticated;
grant select on public.orders, public.order_items to authenticated;

alter table public.order_items enable row level security;
-- "Users can view their own orders" on public.orders is kept as is.
drop policy if exists "Users can view their own order items" on public.order_items;
create policy "Users can view their own order items" on public.order_items
  for select to authenticated
  using (exists (select 1 from public.orders o
                 where o.id = order_id and o.user_id = (select auth.uid())));

-- books: any signed-in visitor could insert/update books. Manage books
-- from the dashboard (service role) instead.
drop policy if exists "Only authenticated users can insert books" on public.books;
drop policy if exists "Only authenticated users can update books" on public.books;
revoke insert, update, delete, truncate on public.books from anon, authenticated;

-- view counter keeps working without update rights on books
alter function public.calculate_popularity_score(uuid) set search_path = public;
alter function public.increment_view_count(uuid) security definer;
alter function public.increment_view_count(uuid) set search_path = public;

-- advisor: event-trigger helper must not be callable through the API
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- old reserve-on-add model
drop function if exists public.cleanup_expired_carts();
drop function if exists public.reserve_book_quantity(uuid, integer);
drop function if exists public.release_book_quantity(uuid, integer);

-- ---------------------------------------------------------------------
-- 4. Private helpers (not exposed through the API)
-- ---------------------------------------------------------------------
create or replace function private.book_price(p_price numeric, p_discount numeric)
returns numeric language sql immutable set search_path = '' as $$
  select round(p_price * (1 - coalesce(p_discount, 0) / 100), 2)
$$;

-- active cart of the caller: user cart when signed in, otherwise guest cart
create or replace function private.cart_find(p_session_id text)
returns uuid language sql stable security definer set search_path = '' as $$
  select c.id from public.carts c
  where c.status = 'active'
    and case when auth.uid() is not null
             then c.user_id = auth.uid()
             else c.user_id is null and c.session_id = p_session_id end
  limit 1
$$;

create or replace function private.cart_get_or_create(p_session_id text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid := private.cart_find(p_session_id);
begin
  if v_id is not null then
    return v_id;
  end if;
  if v_uid is null and (p_session_id is null or length(p_session_id) < 32) then
    raise exception 'Cart session is missing' using errcode = '22023';
  end if;
  insert into public.carts (user_id, session_id)
  values (v_uid, case when v_uid is null then p_session_id end)
  on conflict do nothing
  returning id into v_id;
  return coalesce(v_id, private.cart_find(p_session_id));
end
$$;

revoke all on all functions in schema private from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 5. Public RPCs
-- ---------------------------------------------------------------------

-- Cart summary for header mini-cart and cart/checkout pages
create or replace function public.cart_get(p_session_id text default null)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_cart uuid := private.cart_find(p_session_id);
begin
  if v_cart is null then
    return jsonb_build_object('id', null, 'items', '[]'::jsonb, 'count', 0, 'subtotal', 0);
  end if;
  return (
    select jsonb_build_object(
      'id', v_cart,
      'items', coalesce(jsonb_agg(jsonb_build_object(
          'id', ci.id,
          'book_id', b.id,
          'slug', b.slug,
          'title', b.title,
          'cover_image', b.cover_image,
          'regular_price', b.price,
          'unit_price', private.book_price(b.price, b.discount),
          'quantity', ci.quantity,
          'stock', b.quantity,
          'line_total', private.book_price(b.price, b.discount) * ci.quantity
        ) order by ci.created_at), '[]'::jsonb),
      'count', coalesce(sum(ci.quantity), 0),
      'subtotal', coalesce(sum(private.book_price(b.price, b.discount) * ci.quantity), 0))
    from public.cart_items ci
    join public.books b on b.id = ci.book_id
    where ci.cart_id = v_cart
  );
end
$$;

create or replace function public.cart_add_item(
  p_session_id text, p_book_id uuid, p_quantity integer default 1)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_cart uuid;
  v_title text;
  v_stock integer;
  v_price numeric;
  v_in_cart integer;
begin
  if p_quantity is null or p_quantity < 1 then
    raise exception 'Quantity must be at least 1' using errcode = '22023';
  end if;

  select b.title, b.quantity, private.book_price(b.price, b.discount)
    into v_title, v_stock, v_price
  from public.books b where b.id = p_book_id;
  if not found then
    raise exception 'Book not found' using errcode = 'P0002';
  end if;

  v_cart := private.cart_get_or_create(p_session_id);
  select ci.quantity into v_in_cart
  from public.cart_items ci where ci.cart_id = v_cart and ci.book_id = p_book_id;

  if coalesce(v_in_cart, 0) + p_quantity > v_stock then
    raise exception '%', case
      when v_stock = 0 then format('"%s" is out of stock.', v_title)
      when coalesce(v_in_cart, 0) > 0 then format(
        'You cannot add that amount to the cart — we have %s in stock and you already have %s in your cart.',
        v_stock, v_in_cart)
      else format('You cannot add that amount of "%s" to the cart — we have %s in stock.', v_title, v_stock)
    end using errcode = 'P0001';
  end if;

  insert into public.cart_items (cart_id, book_id, quantity, price_at_addition)
  values (v_cart, p_book_id, p_quantity, v_price)
  on conflict (cart_id, book_id)
  do update set quantity = public.cart_items.quantity + excluded.quantity;

  update public.carts set updated_at = now() where id = v_cart;
  update public.books set cart_add_count = cart_add_count + 1 where id = p_book_id;

  return public.cart_get(p_session_id);
end
$$;

-- Set quantities in one call ("Update cart"). p_items = [{"id": uuid, "quantity": int}]
-- quantity 0 removes the line.
create or replace function public.cart_update_items(p_session_id text, p_items jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_cart uuid := private.cart_find(p_session_id);
  r record;
begin
  if v_cart is null then
    return public.cart_get(p_session_id);
  end if;

  for r in
    select (e ->> 'id')::uuid as id, greatest((e ->> 'quantity')::integer, 0) as quantity
    from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) e
  loop
    if r.quantity = 0 then
      delete from public.cart_items where id = r.id and cart_id = v_cart;
    else
      if r.quantity > (select b.quantity from public.cart_items ci
                       join public.books b on b.id = ci.book_id
                       where ci.id = r.id and ci.cart_id = v_cart) then
        raise exception '%', (
          select format('You cannot add that amount of "%s" to the cart — we have %s in stock.', b.title, b.quantity)
          from public.cart_items ci join public.books b on b.id = ci.book_id where ci.id = r.id
        ) using errcode = 'P0001';
      end if;
      update public.cart_items set quantity = r.quantity
      where id = r.id and cart_id = v_cart;
    end if;
  end loop;

  update public.carts set updated_at = now() where id = v_cart;
  return public.cart_get(p_session_id);
end
$$;

create or replace function public.cart_remove_item(p_session_id text, p_item_id uuid)
returns jsonb language sql security definer set search_path = '' as $$
  select public.cart_update_items(p_session_id,
    jsonb_build_array(jsonb_build_object('id', p_item_id, 'quantity', 0)))
$$;

-- Call right after a successful sign-in with the guest cookie value.
create or replace function public.merge_guest_cart(p_session_id text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_guest uuid;
  v_user uuid;
begin
  if v_uid is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  select id into v_guest from public.carts
  where status = 'active' and user_id is null and session_id = p_session_id;
  if v_guest is null then
    return public.cart_get(null);
  end if;

  select id into v_user from public.carts where status = 'active' and user_id = v_uid;

  if v_user is null then
    update public.carts set user_id = v_uid, session_id = null, updated_at = now()
    where id = v_guest;
  else
    insert into public.cart_items (cart_id, book_id, quantity, price_at_addition)
    select v_user, gi.book_id, least(gi.quantity, b.quantity), gi.price_at_addition
    from public.cart_items gi
    join public.books b on b.id = gi.book_id
    where gi.cart_id = v_guest and b.quantity > 0
    on conflict (cart_id, book_id) do update
      set quantity = least(public.cart_items.quantity + excluded.quantity,
                           (select b2.quantity from public.books b2 where b2.id = excluded.book_id));
    delete from public.carts where id = v_guest;
    update public.carts set updated_at = now() where id = v_user;
  end if;

  return public.cart_get(null);
end
$$;

-- Checkout: validates and decrements stock atomically, snapshots items.
create or replace function public.place_order(
  p_session_id text,
  p_email text,
  p_billing jsonb,
  p_shipping jsonb default null,
  p_payment_method text default 'cod',
  p_note text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_cart uuid := private.cart_find(p_session_id);
  v_order uuid;
  v_number bigint;
  v_key uuid;
  v_subtotal numeric := 0;
  v_lines integer := 0;
  r record;
begin
  if v_cart is null then
    raise exception 'Your cart is currently empty.' using errcode = 'P0001';
  end if;
  if p_email is null or p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Please enter a valid email address.' using errcode = '22023';
  end if;
  if p_payment_method not in ('bacs', 'cheque', 'cod') then
    raise exception 'Invalid payment method.' using errcode = '22023';
  end if;

  -- lock the books rows in a stable order, then validate stock
  for r in
    select ci.quantity, b.title, b.quantity as stock,
           private.book_price(b.price, b.discount) as unit_price
    from public.cart_items ci
    join public.books b on b.id = ci.book_id
    where ci.cart_id = v_cart
    order by b.id
    for update of b
  loop
    if r.quantity > r.stock then
      raise exception '%', format('Sorry, we do not have enough "%s" in stock to fulfill your order (%s available).', r.title, r.stock)
        using errcode = 'P0001';
    end if;
    v_subtotal := v_subtotal + r.unit_price * r.quantity;
    v_lines := v_lines + 1;
  end loop;

  if v_lines = 0 then
    raise exception 'Your cart is currently empty.' using errcode = 'P0001';
  end if;

  insert into public.orders (user_id, cart_id, status, email, billing_address,
    shipping_address, payment_method, customer_note, subtotal, shipping_total, total_amount)
  values (auth.uid(), v_cart, 'pending', lower(trim(p_email)), coalesce(p_billing, '{}'::jsonb),
    coalesce(p_shipping, p_billing, '{}'::jsonb), p_payment_method, nullif(trim(p_note), ''),
    v_subtotal, 0, v_subtotal)
  returning id, order_number, order_key into v_order, v_number, v_key;

  insert into public.order_items (order_id, book_id, title, unit_price, quantity)
  select v_order, b.id, b.title, private.book_price(b.price, b.discount), ci.quantity
  from public.cart_items ci join public.books b on b.id = ci.book_id
  where ci.cart_id = v_cart;

  update public.books b
  set quantity = b.quantity - ci.quantity,
      purchase_count = b.purchase_count + ci.quantity
  from public.cart_items ci
  where ci.cart_id = v_cart and ci.book_id = b.id;

  update public.carts set status = 'converted', updated_at = now() where id = v_cart;

  return jsonb_build_object('order_id', v_order, 'order_number', v_number,
                            'order_key', v_key, 'total', v_subtotal);
end
$$;

-- "Order received" page (guest or user): needs the secret order_key
create or replace function public.order_get(p_order_key uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'order_number', o.order_number,
    'status', o.status,
    'created_at', o.created_at,
    'email', o.email,
    'payment_method', o.payment_method,
    'billing_address', o.billing_address,
    'shipping_address', o.shipping_address,
    'customer_note', o.customer_note,
    'subtotal', o.subtotal,
    'shipping_total', o.shipping_total,
    'total', o.total_amount,
    'items', coalesce((select jsonb_agg(jsonb_build_object(
        'title', oi.title, 'quantity', oi.quantity,
        'unit_price', oi.unit_price, 'line_total', oi.line_total) order by oi.created_at)
      from public.order_items oi where oi.order_id = o.id), '[]'::jsonb))
  from public.orders o where o.order_key = p_order_key
$$;

revoke all on function
  public.cart_get(text),
  public.cart_add_item(text, uuid, integer),
  public.cart_update_items(text, jsonb),
  public.cart_remove_item(text, uuid),
  public.merge_guest_cart(text),
  public.place_order(text, text, jsonb, jsonb, text, text),
  public.order_get(uuid)
from public, anon, authenticated;

grant execute on function
  public.cart_get(text),
  public.cart_add_item(text, uuid, integer),
  public.cart_update_items(text, jsonb),
  public.cart_remove_item(text, uuid),
  public.place_order(text, text, jsonb, jsonb, text, text),
  public.order_get(uuid)
to anon, authenticated;
grant execute on function public.merge_guest_cart(text) to authenticated;

-- ---------------------------------------------------------------------
-- 6. Housekeeping: drop abandoned guest carts after 30 days (no stock
--    to release any more).
-- ---------------------------------------------------------------------
select cron.schedule(
  'cleanup-abandoned-guest-carts',
  '17 3 * * *',
  $cron$delete from public.carts
        where status = 'active' and user_id is null
          and updated_at < now() - interval '30 days'$cron$
);
