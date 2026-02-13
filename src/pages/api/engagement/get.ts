import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";
import type { ContentType } from "../../../lib/supabase";
import { getClientIP, hashIP } from "../../../utils/request";

export const prerender = false;

// Validate content type
function isValidContentType(type: string | null): type is ContentType {
  return type === "post" || type === "destination";
}

export const GET: APIRoute = async ({ request }) => {
  try {
    const requestUrl = new URL(request.url);
    const slug = requestUrl.searchParams.get("slug");
    const type = requestUrl.searchParams.get("type") || "post"; // Default to 'post' for backward compatibility

    console.log("GET /api/engagement/get:", { slug, type });

    if (!slug) {
      return new Response(
        JSON.stringify({
          error: "Slug is required",
          details: "Please provide a slug query parameter",
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

    // Get total engagement count for this item
    const { count, error: countError } = await supabase
      .from("engagement")
      .select("*", { count: "exact", head: true })
      .eq("slug", slug)
      .eq("type", type);

    if (countError) {
      console.error("Supabase count error:", countError);
      throw countError;
    }

    // Check if this IP has already engaged with this item
    const { data: existingEngagement, error: engagementError } = await supabase
      .from("engagement")
      .select("id")
      .eq("slug", slug)
      .eq("type", type)
      .eq("ip_hash", ipHash)
      .single();

    if (engagementError && engagementError.code !== "PGRST116") {
      console.error("Supabase engagement check error:", engagementError);
      throw engagementError;
    }

    const response = {
      count: count || 0,
      hasLiked: !!existingEngagement,
    };

    console.log("Returning engagement data:", response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching engagement:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch engagement",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
