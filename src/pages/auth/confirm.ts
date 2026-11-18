export const prerender = false;

import type { APIRoute } from "astro";
import type { EmailOtpType } from "@supabase/supabase-js";

// Link fallback for the verification email (Supabase "token_hash" flow).
// Template link: {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
export const GET: APIRoute = async ({ url, locals, redirect }) => {
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  if (tokenHash && type) {
    const { error } = await locals.supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    if (!error) return redirect("/email-verified");
  }
  return redirect("/verify-email?error=1");
};
