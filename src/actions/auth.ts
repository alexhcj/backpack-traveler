import type { AstroCookies } from "astro";
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

const codeEmail = z.object({
  email: z.email({ message: "Invalid email address" }),
});

/** Guest cart -> user cart (call right after the user became signed in) */
async function mergeGuestCart(
  locals: App.Locals,
  cookies: AstroCookies,
  userId: string | undefined,
) {
  const guestCart = cookies.get(CART_COOKIE)?.value;
  if (!guestCart) return;
  const merged = await CartService.merge(locals.supabase, guestCart);
  // Evidence for the merge: who it ran for, and what the cart holds now
  console.info("[cart-merge]", {
    userId,
    guestSession: `${guestCart.slice(0, 8)}…`,
    items: merged.data?.items.length ?? null,
    units: merged.data?.count ?? null,
    error: merged.error?.message ?? null,
  });
  cookies.delete(CART_COOKIE, { path: "/" });
}

export const auth = {
  signIn: defineAction({
    accept: "form",
    input: credentials,
    handler: async ({ email, password }, { locals, cookies }) => {
      const { data, error } = await locals.supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        throw new ActionError({
          code: "UNAUTHORIZED",
          // LoginForm links to /verify-email when it sees this exact message
          message:
            error.code === "email_not_confirmed"
              ? "Email not confirmed"
              : error.message,
        });
      }
      await mergeGuestCart(locals, cookies, data.user?.id);
      return { ok: true };
    },
  }),

  /**
   * Sign up. With "Confirm email" ON in Supabase there is no session yet:
   * the user enters the emailed 6-digit code on /verify-email. With it OFF the
   * user is signed in right away.
   */
  register: defineAction({
    accept: "form",
    input: credentials,
    handler: async ({ email, password }, { locals, cookies }) => {
      const { data, error } = await locals.supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        throw new ActionError({ code: "BAD_REQUEST", message: error.message });
      }
      if (data.session) {
        await mergeGuestCart(locals, cookies, data.user?.id);
        return { next: "/account" };
      }
      return { next: `/verify-email?email=${encodeURIComponent(email)}` };
    },
  }),

  verifyOtp: defineAction({
    accept: "form",
    input: z.object({
      email: z.email({ message: "Invalid email address" }),
      token: z
        .string()
        .trim()
        .regex(/^\d{6}$/, { message: "Enter the 6-digit code." }),
    }),
    handler: async ({ email, token }, { locals, cookies }) => {
      const { data, error } = await locals.supabase.auth.verifyOtp({
        email,
        token,
        type: "signup",
      });
      if (error || !data.session) {
        throw new ActionError({
          code: "BAD_REQUEST",
          message: "This code is invalid or has expired. Request a new one.",
        });
      }
      await mergeGuestCart(locals, cookies, data.user?.id);
      return { ok: true };
    },
  }),

  resendCode: defineAction({
    accept: "form",
    input: codeEmail,
    handler: async ({ email }, { locals }) => {
      const { error } = await locals.supabase.auth.resend({
        type: "signup",
        email,
      });
      if (error) {
        throw new ActionError({
          code: "TOO_MANY_REQUESTS",
          message: "Could not send a new code yet. Please wait a moment.",
        });
      }
      return { sent: true };
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
