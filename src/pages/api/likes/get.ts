export const prerender = false;

import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";
import { getClientIP, hashIP } from "../../../utils/request";

export const GET: APIRoute = async ({ request }) => {
  try {
    const requestUrl = new URL(request.url);
    const slug = requestUrl.searchParams.get("slug");

    if (!slug) {
      return new Response(
        JSON.stringify({
          error: "Slug is required",
          details:
            "Please provide a slug query parameter like: /api/likes/get?slug=my-post",
          debug: {
            receivedUrl: request.url,
            search: requestUrl.search,
            allParams: Object.fromEntries(requestUrl.searchParams.entries()),
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const clientIP = getClientIP(request);
    const ipHash = hashIP(clientIP);

    // Get total likes count for this post
    const { count, error: countError } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("post_slug", slug);

    if (countError) {
      console.error("Supabase count error:", countError);
      throw countError;
    }

    // Check if this IP has already liked this post
    const { data: existingLike, error: likeError } = await supabase
      .from("likes")
      .select("id")
      .eq("post_slug", slug)
      .eq("ip_hash", ipHash)
      .single();

    if (likeError && likeError.code !== "PGRST116") {
      // PGRST116 = no rows returned
      throw likeError;
    }

    const response = {
      count: count || 0,
      hasLiked: !!existingLike,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Failed to fetch likes",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
