import { ActionError, defineAction } from "astro:actions";
import { z } from "astro/zod";
import { CartService } from "../lib/services/cart";
import { CART_COOKIE } from "../middleware";

const credentials = z.object({
  email: z.email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" }),
});

export const auth = {
  signIn: defineAction({
    accept: "form",
    input: credentials,
    handler: async ({ email, password }, { locals, cookies }) => {
      const { data: auth, error } =
        await locals.supabase.auth.signInWithPassword({ email, password });
      if (error) {
        throw new ActionError({ code: "UNAUTHORIZED", message: error.message });
      }

      // Guest cart -> user cart
      const guestCart = cookies.get(CART_COOKIE)?.value;
      if (guestCart) {
        const merged = await CartService.merge(locals.supabase, guestCart);
        // Evidence for the merge: who it ran for, and what the cart holds now
        console.info("[cart-merge]", {
          userId: auth.user?.id,
          guestSession: `${guestCart.slice(0, 8)}…`,
          items: merged.data?.items.length ?? null,
          units: merged.data?.count ?? null,
          error: merged.error?.message ?? null,
        });
        cookies.delete(CART_COOKIE, { path: "/" });
      }
      return { ok: true };
    },
  }),

  register: defineAction({
    accept: "form",
    input: credentials,
    handler: async ({ email, password }, { locals }) => {
      const { error } = await locals.supabase.auth.signUp({ email, password });
      if (error) {
        throw new ActionError({ code: "BAD_REQUEST", message: error.message });
      }
      return { ok: true };
    },
  }),

  signOut: defineAction({
    accept: "form",
    handler: async (_, { locals }) => {
      await locals.supabase.auth.signOut();
      return { ok: true };
    },
  }),
};
