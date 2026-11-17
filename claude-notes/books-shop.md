# Books mini shop — status & plan

_Analysed 2026-11-16 against `main` @ d5a853f (uncommitted work on top)._

## What is already committed
- Shop page (`/shop`) with sort / category / price filters, book list with ratings.
- Book details page (`/books/[book]`) with reviews, view tracking, quantity input + "Add to cart" form (posts to `/api/cart/add`).
- Header mini-cart dropdown (`HeaderCart.astro`) — static markup matching the ref site, shown on `/shop` and `/books/*` only.
- Email/password auth: `/register`, `/login`, `/api/auth/{register,signin,signout}`; tokens stored in `sb-access-token` / `sb-refresh-token` cookies; `/account` is a stub with a sign-out button.

## Uncommitted work (the "add: books mini shop" attempt)

| Area | Files | State |
|---|---|---|
| Env rename | `.env.example`, `env.d.ts`, `lib/supabase.ts` | `SUPABASE_ANON_KEY` → `SUPABASE_KEY` (value is a publishable key) |
| Cart data layer | `lib/services/cart.ts`, `types/cart.ts`, `BooksService.checkBookAvailability`, `TAvailableBook` | Mostly written |
| Add-to-cart (2 copies) | `pages/api/cart/add.ts` **and** `actions/cart.ts` (`addToCart`, `removeFromCart`, `updateCartItemQuantity`) | Duplicate logic; the form uses the API route, actions are unused |
| Guest/user identity | `lib/services/auth.ts` (`getAuthenticatedUser`, `getOrCreateGuestSession`), `lib/supabase/server.ts` | Partly written; no middleware so `locals.user` is never set |
| Browser client | `lib/supabase/client.ts`, `<script>` in `HeaderCart.astro` | Doesn't work (see bugs) |
| Cart page | `pages/cart.astro`, `layouts/CartLayout.astro`, `components/Cart/{CartTable,CartCoupon,CartTotal}.astro` | Empty state done; table is a debug list; coupon/total are placeholders |
| Dead code | `lib/services/auth-service.ts`, `types/auth.ts` | Copy-paste of subscriptions service; references tables/types that don't exist (all 13 `tsc` errors except 2 come from here) |
| Icons | `public/svg/account.svg`, `public/svg/login.svg` | Not used yet (already in Figma: `342:9`, `342:10`) |
| Test data | `src/content/comments/fdasf-….md` | Test comment written by the comments API — delete, don't commit |

## Bugs / blockers found
1. **Add to cart always fails for new items** — `CartService.addCartItem` inserts without `.select()`, so `data` is `null`, the service throws "No data returned", and the route answers "Failed to add item to cart".
2. **Logged-in user is never recognised** — no `src/middleware.ts`, so `locals.user` is undefined (also a TS error). Every cart is a guest cart.
3. **Shared server Supabase client gets a user session** — `getAuthenticatedUser` and `account.astro` call `setSession` on the single module-level client. On the Node server that session leaks between concurrent requests. Needs a per-request client.
4. **Header cart script can't work**: `<script type="module">` with an extra attribute is not processed by Astro (treated as inline), so the `/src/...` import breaks in the build; non-`PUBLIC_` env vars are `undefined` in the browser; `session_id` is an `httpOnly` cookie, so JS can't read it; `client.ts` `console.log`s the URL and key. Reading carts straight from the browser would also need RLS that exposes carts to anon.
5. **Stock reservation leaks** — `reserve_book_quantity` runs at add-to-cart time, but nothing releases stock when a cart is abandoned (`expires_at` is never set). Also the RPC is called with `p_book_id/p_quantity` while the hand-written types say `book_id/quantity` — needs checking against the real function.
6. `checkItemInCart` uses `.single()` → logs an error every time the book isn't in the cart yet (use `.maybeSingle()`).
7. Add-to-cart form posts to a JSON endpoint → without JS the user lands on raw JSON; there's no success feedback / badge update.
8. Shop grid "Add to cart" buttons do nothing.
9. `getCart` creates a cart on every visit to `/cart` (even empty, even bots).

Type check (`tsc --noEmit`, `.ts` only): 15 errors — 13 from the dead auth files, 2 from `locals.user`. `astro build` compiles; prerendered shop/book pages need Supabase reachable at build time.

## Plane
_Not reviewed yet — needs the user to sign in to Plane in the browser pane._

## Plan

### Phase 0 — clean up & foundations (small, do first)
- Delete `auth-service.ts`, `types/auth.ts`, the test comment; drop the duplicate `/api/cart/add` **or** the actions (keep **Astro actions** — native, typed, work with and without JS).
- Env via `astro:env` schema: `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_PUBLISHABLE_KEY` (client+server), `SUPABASE_SECRET_KEY` (server-only, for stock/merge/order RPCs if RLS needs it). Update `.env.example`. *(= todo "replace .env secret key / PUBLIC envs")*
- Add `@supabase/ssr`; `lib/supabase/server.ts` → per-request `createServerClient` with Astro cookies; `lib/supabase/client.ts` → `createBrowserClient` (only if still needed).
- `src/middleware.ts`: build the per-request client, put `locals.supabase`, `locals.user`, `locals.cartSessionId` (guest cookie) ; type them in `env.d.ts` (`App.Locals`).
- Move auth to Supabase SSR cookies (replaces manual `sb-*-token` cookies).

### Phase 1 — cart core (finish the current feature)
- Fix `addCartItem` (`.select().single()`), `checkItemInCart` (`.maybeSingle()`), `getCart` → split into `findCart` / `getOrCreateCart` (create only on add).
- Stock: validate on add/update; **reserve at checkout/order**, not on add (or add expiry + cleanup job). Confirm real RPC signatures; regenerate DB types with `supabase gen types`.
- Actions: `cart.add`, `cart.update` (qty), `cart.remove`, `cart.get` (summary for header).
- Wire book page form + shop grid buttons to `actions.cart.add`, with progressive enhancement and a toast/badge update.

### Phase 2 — UI exactly like the ref site
- **Header mini-cart**: render from real data as a **server island** (`<HeaderCart server:defer />`) so pages stay static; client refresh after add/remove via `actions.cart.get`. Show/hide rules as on ref (*verify*).
- **Cart page** (`/cart`): product table (remove ×, thumb, product, price, quantity, subtotal), coupon field + "Apply coupon", "Update cart", Cart totals block, "Proceed to checkout", empty state (done). *Exact layout to be verified on the ref site with a filled cart.*
- Coupon: decide scope (static coupon table in Supabase vs. skip for now).

### Phase 3 — login cart merge *(todo "update cart if user logs in")*
- Postgres function `merge_guest_cart(p_session_id text, p_user_id uuid)` (security definer): move items from the guest cart into the user's active cart (sum quantities, cap by stock), mark the guest cart expired. Call it in the sign-in action/endpoint right after a successful login, then clear the `session_id` cookie.

### Phase 4 — checkout & account
- **Checkout** (`/checkout`): billing/shipping form as on ref, order review, payment = offline method(s) only (no real payments). Action `order.place`: re-validate stock, reserve/decrement in one RPC (transaction), insert `orders` (+ `order_items` table — currently missing; store price & title snapshot), mark cart converted. Order received page.
- **Account** (`/account`): as on ref `/my-account/` (dashboard, orders, addresses, account details, logout) — any part we change → Figma.
- Header account/login icon (new UI, not on ref) → design in Figma first.

### Supabase work to list (needs DB access)
RLS policies for carts/cart_items/orders, `order_items` table, `merge_guest_cart`, `place_order`, stock reserve/release semantics, abandoned-cart cleanup (pg_cron), regenerated types.

---

## Implementation status (updated 2026-11-16)

| Phase | State |
|---|---|
| 0 Foundations | **Done, unreviewed.** Migration applied to `hzibisccskwlwouszepc`; types in `src/types/supabase.ts`; `astro:env` schema; `@supabase/ssr` server client + middleware (`locals.supabase/user/cartSessionId`); auth as actions (`auth.signIn/register/signOut`, merge on sign-in); dead files deleted. |
| 1 Cart core | **Done, untested in browser.** `CartService` (RPC wrapper), `actions.cart.{get,add,update,remove}`, book page form + shop grid buttons, `cart:updated` event, add-to-cart notice on book page. |
| 2 UI | **Partial.** Header mini-cart is a server island (re-renders from `cart:updated`). `/cart` page works with real data but layout is provisional (needs ref screenshots); no coupon / shipping rows yet. |
| 3 Checkout | Not started (needs field list / layout confirmation + decisions below). |
| 4 Account | Not started (needs Figma frames for header icon + any deviations). |

### Leftovers / follow-ups
- `src/pages/api/auth/{register,signin,signout}.ts` are superseded by `actions.auth.*` and still use the old `sb-*` cookies → delete (waiting for OK).
- `src/components/Cart/CartCoupon.astro` is an unused placeholder.
- Pre-existing type drift now visible with generated types (not caused by this work): `actions/form.ts` (`events` table does not exist), `lib/services/books.ts`, `pages/api/book-reviews/post.ts` (`email` column), `utils/engagement.ts` (old `item_slug/item_type` columns; probably dead).
- Pre-existing build failure: `/categories` and `/get-in-touch` (`TravelGuides.astro` globs `src/pages/books/*.md`, which no longer exists).
- `src/content/comments` is now empty (test comment deleted) → Astro warns "collection comments does not exist or is empty" at build.
- Security advisors after migration: only the intended `SECURITY DEFINER` RPC warnings remain, plus pre-existing (leaked-password protection off, mutable search_path on 4 functions).

---

## Status update (2026-11-17) — Figma approved, code implemented

Figma: file `Jg63Lpovr5sGHDamyywA0w`, page **Shop** (components + 7 page frames).

| Area | State |
|---|---|
| Phase 0 foundations | Done (see above); superseded `api/auth/*`, `CartCoupon`, `utils/engagement.ts` deleted; types drift fixed (events inserts removed, view casts, review email column) |
| Add-to-cart states | `scripts/cart-ui.ts` + `Cart/AddToCartButton.astro` (Add to cart → Adding to cart + `Preloader` → View cart → /cart). Used on shop grid and book page; initial state from `actions.cart.get` |
| Header | `fixedHeader` prop (Layout → Header) on shop, book, cart, checkout, order-received; cart icon also on /cart and /checkout |
| Cart page | Figma layout: thumbnail, stepper (`QuantityField`), coupon field, Update cart (+preloader), totals with shipping row. Coupon action always answers "Coupon … does not exist!" (no `coupons` table yet) |
| Shipping | Migration `20261117090000_cart_shipping.sql` (flat $5.00 via `private.shipping_rate()`), applied; `cart_get` returns `shipping`/`total`; `place_order` stores them |
| Checkout | `/checkout`, `actions.checkout.placeOrder`, payment methods bacs/cheque/cod (`utils/payment.ts`), `/checkout/order-received?key=` |
| Comments collection | custom quiet loader in `content.config.ts` (empty folder is valid) |
| Cart merge | logs `[cart-merge] {userId, guestSession, items, units}` on sign-in |

### Not done
- Phase 4 (account dashboard/orders, header login icon): needs Figma frames first.
- Coupons table, real shipping rules.
- Email confirmation: dashboard setting (user decision).
- Pre-existing, unrelated type errors: `TravelGuides.astro`, `index.astro` (Reviews.astro missing), `ui-preview`, `destination-related-posts`; `/categories` + `/get-in-touch` build failure (`TravelGuides` globs missing `pages/books/*.md`).
