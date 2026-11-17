import { ActionError, defineAction } from "astro:actions";
import { z } from "astro/zod";
import { CartService } from "../lib/services/cart";
import { CART_COOKIE } from "../middleware";

const unwrap = <T>(res: { data: T | null; error: Error | null }) => {
  if (res.error || !res.data) {
    throw new ActionError({
      code: "BAD_REQUEST",
      message: res.error?.message ?? "Something went wrong.",
    });
  }
  return res.data;
};

export const cart = {
  get: defineAction({
    handler: async (_, { locals }) =>
      unwrap(await CartService.get(locals.supabase, locals.cartSessionId)),
  }),

  add: defineAction({
    accept: "form",
    input: z.object({
      bookId: z.uuid(),
      quantity: z.coerce.number().int().min(1).max(99).default(1),
    }),
    handler: async ({ bookId, quantity }, { locals, cookies }) => {
      let sessionId = locals.cartSessionId;

      // Guests get their cart cookie lazily, on the first add.
      if (!locals.user && !sessionId) {
        sessionId = crypto.randomUUID();
        cookies.set(CART_COOKIE, sessionId, {
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
          httpOnly: true,
          sameSite: "lax",
          secure: import.meta.env.PROD,
        });
      }

      return unwrap(
        await CartService.add(locals.supabase, sessionId, bookId, quantity),
      );
    },
  }),

  // Cart page form: parallel arrays `lineId[]` + `quantity[]` (0 removes)
  update: defineAction({
    accept: "form",
    input: z.object({
      lineId: z.array(z.uuid()).default([]),
      quantity: z.array(z.coerce.number().int().min(0).max(99)).default([]),
    }),
    handler: async ({ lineId, quantity }, { locals }) => {
      const items = lineId.map((id, i) => ({ id, quantity: quantity[i] ?? 0 }));
      return unwrap(
        await CartService.update(locals.supabase, locals.cartSessionId, items),
      );
    },
  }),

  // No coupons exist yet (no `coupons` table): same wording as WooCommerce
  applyCoupon: defineAction({
    accept: "form",
    input: z.object({ couponCode: z.string().trim().max(40).default("") }),
    handler: async ({ couponCode }) => {
      throw new ActionError({
        code: "BAD_REQUEST",
        message: couponCode
          ? `Coupon "${couponCode}" does not exist!`
          : "Please enter a coupon code.",
      });
    },
  }),

  remove: defineAction({
    accept: "form",
    input: z.object({ itemId: z.uuid() }),
    handler: async ({ itemId }, { locals }) =>
      unwrap(
        await CartService.remove(locals.supabase, locals.cartSessionId, itemId),
      ),
  }),
};
