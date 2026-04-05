export const prerender = false;

import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const { bookId } = await request.json();

  // Get or create session ID
  const sessionId = request.headers.get("x-session-id") || crypto.randomUUID();

  // Check if already viewed in last hour (prevent spam)
  const { data: recentView } = await supabase
    .from("book_views")
    .select("id")
    .eq("book_id", bookId)
    .eq("session_id", sessionId)
    .gte("viewed_at", new Date(Date.now() - 60 * 60 * 1000).toISOString())
    .single();

  if (!recentView) {
    // Insert view
    await supabase.from("book_views").insert({
      book_id: bookId,
      session_id: sessionId,
      ip_address: clientAddress,
      referrer: request.headers.get("referer"),
    });

    // Increment view count
    await supabase.rpc("increment_view_count", { book_id: bookId });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
