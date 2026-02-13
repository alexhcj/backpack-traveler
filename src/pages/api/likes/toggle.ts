export const prerender = false;

import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";
import { getClientIP, hashIP } from "../../../utils/request";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { slug } = await request.json();

    if (!slug) {
      return new Response(JSON.stringify({ error: "Slug is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const clientIP = getClientIP(request);
    const ipHash = hashIP(clientIP);

    // Check if user has already liked this post
    const { data: existingLike, error: checkError } = await supabase
      .from("likes")
      .select("id")
      .eq("post_slug", slug)
      .eq("ip_hash", ipHash)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      throw checkError;
    }

    let hasLiked: boolean;
    let newCount: number;

    if (existingLike) {
      // Unlike: remove the like
      const { error: deleteError } = await supabase
        .from("likes")
        .delete()
        .eq("id", existingLike.id);

      if (deleteError) {
        throw deleteError;
      }

      hasLiked = false;
    } else {
      // Like: add the like
      const { error: insertError } = await supabase
        .from("likes")
        .insert({ post_slug: slug, ip_hash: ipHash });

      if (insertError) {
        throw insertError;
      }

      hasLiked = true;
    }

    // Get updated count
    const { count, error: countError } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("post_slug", slug);

    if (countError) {
      throw countError;
    }

    newCount = count || 0;

    return new Response(
      JSON.stringify({
        count: newCount,
        hasLiked,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error toggling like:", error);
    return new Response(JSON.stringify({ error: "Failed to toggle like" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
