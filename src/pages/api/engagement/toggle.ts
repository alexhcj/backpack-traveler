import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";
import type { ContentType } from "../../../lib/supabase";
import { getClientIP, hashIP } from "../../../utils/request";

export const prerender = false;

// Validate content type
function isValidContentType(type: string): type is ContentType {
  return type === "post" || type === "destination";
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const { slug, type = "post" } = await request.json();

    console.log("POST /api/engagement/toggle:", { slug, type });

    if (!slug) {
      return new Response(
        JSON.stringify({
          error: "Slug is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (!isValidContentType(type)) {
      return new Response(
        JSON.stringify({
          error: "Invalid content type",
          details: 'Type must be either "post" or "destination"',
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const clientIP = getClientIP(request);
    const ipHash = hashIP(clientIP);

    // Check if user has already engaged with this item
    const { data: existingEngagement, error: checkError } = await supabase
      .from("engagement")
      .select("id")
      .eq("slug", slug)
      .eq("type", type)
      .eq("ip_hash", ipHash)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      throw checkError;
    }

    let hasLiked: boolean;

    if (existingEngagement) {
      // Unlike: remove the engagement
      const { error: deleteError } = await supabase
        .from("engagement")
        .delete()
        .eq("id", existingEngagement.id);

      if (deleteError) {
        throw deleteError;
      }

      hasLiked = false;
      console.log("Removed engagement:", { slug, type });
    } else {
      // Like: add the engagement
      const { error: insertError } = await supabase.from("engagement").insert({
        slug: slug,
        type: type,
        ip_hash: ipHash,
      });

      if (insertError) {
        throw insertError;
      }

      hasLiked = true;
      console.log("Added engagement:", { slug, type });
    }

    // Get updated count
    const { count, error: countError } = await supabase
      .from("engagement")
      .select("*", { count: "exact", head: true })
      .eq("slug", slug)
      .eq("type", type);

    if (countError) {
      throw countError;
    }

    const response = {
      count: count || 0,
      hasLiked,
    };

    console.log("Toggle result:", response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error toggling engagement:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to toggle engagement",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
