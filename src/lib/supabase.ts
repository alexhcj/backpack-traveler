import { createClient } from "@supabase/supabase-js";
import {
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_PUBLISHABLE_KEY,
} from "astro:env/client";
import type { Database } from "../types/supabase";

/**
 * Plain anon client. Use ONLY for public reads that do not depend on the
 * visitor (books, reviews, engagement, build time). Anything tied to a user
 * or cart must use the per-request `Astro.locals.supabase`.
 */
export const supabase = createClient<Database>(
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

export type ContentType = "post" | "destination";
