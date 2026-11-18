# backpack-traveler — notes for Claude

Travel blog + small books shop, rebuilt from a WordPress theme with Astro (native features first, minimal approach).

## Links
- Reference site (design + behaviour source of truth): https://backpacktraveler.qodeinteractive.com/
  - Shop: /shop/ · Cart: /cart/ · Checkout: /checkout/ · Account: /my-account/
  - Note: the demo is behind a Cloudflare bot check; automated browsers get blocked on add-to-cart. Ask the user to pass it in the browser pane, or to share screenshots.
- Figma (design-system assets + components, and any UI that is NOT on the ref site): https://www.figma.com/design/Jg63Lpovr5sGHDamyywA0w/backpack-traveler
  - fileKey `Jg63Lpovr5sGHDamyywA0w`; pages: `0:1` Design system (Svgs, Icons, Images, Countries, maps), `319:20` Components (WorldMap)
  - Rule: design must match the ref site exactly. Anything new/different (e.g. header account/login icon, account page) gets a frame in Figma.
- Plane (lightweight to-do notes, user updates them by hand): https://app.plane.so/awakened-eternity/projects/cee864ca-54ce-4610-86ab-aafcc7936667/issues

### Plane API (use this instead of the browser — the pane isn't signed in)
- Credentials live in `.env` (gitignored): `PLANE_API_BASE_URL`, `PLANE_API_KEY`, `PLANE_WORKSPACE_SLUG`, `PLANE_PROJECT_ID`. Never print the key.
- Task by identifier (e.g. BACKPACKTR-81), from bash:
  `set -a; . ./.env; set +a; curl -s -H "X-API-Key: $PLANE_API_KEY" "$PLANE_API_BASE_URL/api/v1/workspaces/$PLANE_WORKSPACE_SLUG/work-items/BACKPACKTR-81/"` → JSON, `description_html` holds the checklist.
- Python isn't installed; parse JSON with `node -e`.

## Stack
- Astro 6 (`output: "static"`, `@astrojs/node` standalone; SSR pages opt in with `export const prerender = false`)
- Supabase: books, book_reviews, engagement, subscriptions, carts, cart_items, orders, auth
- Content: posts/destinations as md/mdx pages, comments as an Astro content collection (`src/content/comments`)
- Types for DB are hand-written in `src/lib/supabase.ts` (`Database`) + helpers in `src/types/database.ts`
- Services pattern: `src/lib/services/*.ts` static classes returning `{ data, error }`

## Conventions
- Keep it minimal and Astro-native (actions, server islands, middleware, astro:env) before adding libraries.
- `.env` holds a Supabase *publishable* key (`sb_publishable_…`) today; never put a secret key in a `PUBLIC_` var.
- `info.md` and `post-types-and-data-list.md` are the user's private scratch notes (gitignored).
- Current feature work + plan: `claude-notes/books-shop.md`
