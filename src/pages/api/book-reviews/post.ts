import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse form data
    const formData = await request.formData();

    const reviewData = {
      rating: parseFloat(formData.get("rating") as string),
      review: (formData.get("review") as string) || null,
      reviewer_name: formData.get("reviewer_name") as string,
      email: formData.get("email") as string,
    };

    // Validate data
    if (
      !reviewData.rating ||
      !reviewData.review ||
      !reviewData.reviewer_name ||
      !reviewData.email
    ) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (
      isNaN(reviewData.rating) ||
      reviewData.rating < 0 ||
      reviewData.rating > 5
    ) {
      return new Response(
        JSON.stringify({ error: "Rating must be between 0 and 5" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Insert into Supabase
    const { data, error } = await supabase
      .from("book_reviews")
      .insert([reviewData])
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return new Response(JSON.stringify({ error: "Failed to save review" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Return success with the created review
    return new Response(JSON.stringify({ success: true, review: data }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
