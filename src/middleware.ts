import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerClient } from "./lib/supabase/server";

export const CART_COOKIE = "bt_cart";

export const onRequest = defineMiddleware(async (context, next) => {
  // Prerendered pages have no request-time data (and no cookies).
  if (context.isPrerendered) return next();

  const supabase = createSupabaseServerClient({
    request: context.request,
    cookies: context.cookies,
  });
  const { data } = await supabase.auth.getUser();

  context.locals.supabase = supabase;
  context.locals.user = data.user;
  // Read only: the cookie is created lazily by `cart.add`.
  context.locals.cartSessionId =
    context.cookies.get(CART_COOKIE)?.value ?? null;

  return next();
});
