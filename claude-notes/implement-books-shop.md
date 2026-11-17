# Brief: finish the books mini shop (Plane #3)

You are implementing the books mini shop for **backpack-traveler** (Astro 6 + Supabase).
Read first: `CLAUDE.md`, `claude-notes/books-shop.md` (status, findings, decisions), and
`supabase/migrations/20261116090000_books_shop_cart.sql`.

## Ground rules
- **Design must match the reference site exactly** (https://backpacktraveler.qodeinteractive.com/cart/, /checkout/, /my-account/). The ref site blocks automated browsers (Cloudflare) — reuse existing styles/tokens (`src/styles/ui.css`, `global.css`, `HeaderCart.astro`, `LoginForm.astro`, `QuantityInput.astro`) and **ask the user for screenshots** when a layout detail is unknown. Don't guess silently.
- Anything **new or different from the ref site** (e.g. header account icon, order-received tweaks) → create a frame in Figma file `Jg63Lpovr5sGHDamyywA0w` (new page "Shop") before/with the code (load the `figma-use` skill first).
- Astro-native, minimal: actions, middleware, server islands, `astro:env`. Only new dependency: `@supabase/ssr`.
- Stock is reserved **only** in `place_order`. Never write to `carts`/`cart_items`/`orders` tables directly — use the RPCs.
- Keep the service pattern (`src/lib/services/*`, `{ data, error }`) where it helps; services take the per-request client as a parameter.
- Don't commit. Leave changes for the user to review, grouped so they can be committed per phase.
- Ask before: applying the migration, deleting files outside the list below, adding dependencies other than `@supabase/ssr`.

## Phase 0 — foundations
1. **Migration**: ask the user, then apply `supabase/migrations/20261116090000_books_shop_cart.sql` (Supabase MCP `apply_migration`, project `hzibisccskwlwouszepc`, or the user runs it). Then run security advisors and regenerate types (`generate_typescript_types`) into `src/types/supabase.ts`; point `src/types/database.ts` helpers at the generated `Database` and remove the hand-written `Database` from `src/lib/supabase.ts`.
2. **Env** (`astro.config.mjs` → `env.schema`): `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_PUBLISHABLE_KEY` (context client, access public), `IP_SALT` (server, secret). Import from `astro:env/*` everywhere; delete `SUPABASE_KEY`/`SUPABASE_ANON_KEY` usage; update `.env.example` and `env.d.ts`. Tell the user to rename keys in `.env` (value stays the same `sb_publishable_…` key).
3. **Clients**: `src/lib/supabase/server.ts` → `createSupabaseServerClient({ request, cookies })` with `@supabase/ssr` `createServerClient` + `parseCookieHeader` / `cookies.set` (check current API with Supabase `search_docs`). Keep `src/lib/supabase.ts` as the plain anon client **only for public reads at build time** (books, reviews). Delete `src/lib/supabase/client.ts`.
4. **Middleware** `src/middleware.ts`: skip when `context.isPrerendered`; set `locals.supabase`, `locals.user` (`auth.getUser()`), `locals.cartSessionId` (cookie `bt_cart`, read only — created lazily by `cart.add`). Type `App.Locals` in `env.d.ts`.
5. **Auth** → SSR cookies: rewrite `/api/auth/signin|register|signout` to use `locals.supabase` (or convert to actions `auth.signIn/register/signOut` — preferred, matches Plane #33/#50). Remove manual `sb-access-token`/`sb-refresh-token` cookies; `account.astro` uses `locals.user`. Sign-in success → `rpc('merge_guest_cart', { p_session_id })` when a `bt_cart` cookie exists, then delete the cookie.
6. **Delete**: `src/lib/services/auth-service.ts`, `src/types/auth.ts`, `src/lib/services/auth.ts`, `src/pages/api/cart/add.ts`, `src/content/comments/fdasf-1772958921242-hvli0yftb.md`; remove `BooksService.checkBookAvailability`/`TAvailableBook` if unused after Phase 1.

## Phase 1 — cart core
- `src/lib/services/cart.ts` → thin wrapper over RPCs: `get`, `add`, `update(items)`, `remove`, `merge`, `placeOrder`, `getOrder(key)`. Types for the RPC JSON (`TCart`, `TCartLine`) in `src/types/cart.ts`. Postgres error `P0001` messages are user-facing; map others to a generic message.
- `src/actions/cart.ts`: `get` (json), `add` / `update` / `remove` (`accept: "form"`). `add` creates the `bt_cart` cookie (`crypto.randomUUID()`, httpOnly, sameSite lax, secure in prod, 30 days) when there is no user and no cookie. Return the cart summary. Use `ActionError` + `isInputError` on the client (Plane #50).
- Book page `QuantityInput.astro`: `method="POST" action={"/cart" + actions.cart.add}` (no-JS fallback lands on the SSR cart page with the result), plus a small script that calls `actions.cart.add` and dispatches `cart:updated` with the summary. Show the WooCommerce-style notice ("“Title” has been added to your cart." + "View cart") as on ref — confirm with the user.
- Shop grid "Add to cart" (`BookList.astro`): same action with quantity 1.

## Phase 2 — UI (exactly like ref)
- **Header mini-cart**: `<HeaderCart server:defer>` with a fallback (icon + badge 0). Render items from `cart.get`: thumb, title link, `qty x price`, remove (×) button, Total, "View cart" / "Checkout", empty state "No products in the cart." Remove calls `actions.cart.remove`. Listen to `cart:updated` and re-render from JSON (use a `<template>`). Keep current show/hide rules unless the ref says otherwise.
- **Cart page** `/cart` (SSR): notices area; table: remove ×, thumbnail, Product, Price, Quantity (reuse the quantity control as a field), Subtotal; actions row: coupon field + "Apply coupon" (see open decisions) and "Update cart" (`actions.cart.update` with all quantities, 0 removes); "Cart totals" block: Subtotal, Total, "Proceed to checkout". Keep the existing empty state. Handle POST results from the no-JS add fallback with `Astro.getActionResult()`.

## Phase 3 — checkout
- `/checkout` (SSR): redirect to `/cart` if empty. "Billing details": First name*, Last name*, Company name (optional), Country*, Street address*, Town / City*, State / County*, Postcode / ZIP*, Phone*, Email address* (prefill from user); "Ship to a different address?" toggle with the same fields; "Order notes (optional)"; "Your order" review table (Product / Subtotal, Subtotal, Total); payment methods: Direct bank transfer, Check payments, Cash on delivery (`bacs|cheque|cod`); "Place order". Verify the field list/labels against ref screenshots.
- `actions.checkout.placeOrder` (`accept: "form"`, zod schema) → `rpc('place_order', …)` → redirect to `/checkout/order-received?key=<order_key>`.
- `/checkout/order-received` (SSR): "Thank you. Your order has been received." + order number, date, email, total, payment method, items table, addresses (`rpc('order_get')`).

## Phase 4 — account
- `/account`: if signed out → login (existing). Signed in → dashboard as ref `/my-account/` (Dashboard, Orders, Addresses, Account details, Log out) — implement Dashboard + Orders (+ order detail via `orders`/`order_items` selects, RLS allows own rows) + Log out; other tabs only if the user asks. Changes vs ref → Figma.
- Header account/login icon (`public/svg/account.svg`, `login.svg`, already in Figma `342:9`, `342:10`) — new UI → Figma frame first, then code.

## Verification (each phase)
- `npx astro check` (add `@astrojs/check` + `typescript` as dev deps only if the user agrees) or `tsc --noEmit`, and `astro build`. The user's `node_modules` is a Windows install: build/check in a scratch copy (`tar` the repo without node_modules into `$HOME/bt`, `npm ci`), never reinstall in the user's folder.
- Exercise RPCs via `execute_sql` inside `begin … rollback` with `set local role anon` + `request.jwt.claims` (see the dry-run pattern used for the migration).
- Ask the user to click through in their dev server: add from book page and shop grid, header badge/list, update/remove in cart, guest → login merge, checkout, order received, account orders, no-JS add.
- Run Supabase security advisors after DB changes.

## Open decisions to ask about when reached
Coupons (hide field vs `coupons` table) · shipping row in totals · which payment methods · add-to-cart notice vs redirect to cart · exact layouts (screenshots).

## When done
Update `claude-notes/books-shop.md` (status per phase) and summarise for the user what to commit; suggest Plane checklist updates for #3 (the user edits Plane by hand).
