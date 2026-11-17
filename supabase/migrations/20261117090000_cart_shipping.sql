-- Flat-rate shipping for the books shop.
-- cart_get now returns `shipping` and `total`; place_order stores them.
-- (Grants are kept: CREATE OR REPLACE with the same signatures.)

create or replace function private.shipping_rate()
returns numeric language sql immutable set search_path = '' as $$
  select 5.00::numeric
$$;
revoke all on function private.shipping_rate() from public, anon, authenticated;

create or replace function public.cart_get(p_session_id text default null)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_cart uuid := private.cart_find(p_session_id);
  v_result jsonb;
begin
  if v_cart is null then
    return jsonb_build_object('id', null, 'items', '[]'::jsonb, 'count', 0,
                              'subtotal', 0, 'shipping', 0, 'total', 0);
  end if;

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
    into v_result
    from public.cart_items ci
    join public.books b on b.id = ci.book_id
    where ci.cart_id = v_cart;

  if (v_result ->> 'count')::integer = 0 then
    return v_result || jsonb_build_object('shipping', 0, 'total', 0);
  end if;
  return v_result || jsonb_build_object(
    'shipping', private.shipping_rate(),
    'total', (v_result ->> 'subtotal')::numeric + private.shipping_rate());
end
$$;

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
  v_shipping numeric := private.shipping_rate();
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
    v_subtotal, v_shipping, v_subtotal + v_shipping)
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
                            'order_key', v_key, 'total', v_subtotal + v_shipping);
end
$$;
