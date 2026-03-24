import type {
  IBookReviewFormData,
  IBookReviewListRO,
  IBookReviewServiceRO,
  TBookReviewInsert,
  TBookReviewUpdate,
} from "../../types/review";
import { supabase } from "../supabase";

export class BookReviewsService {
  /**
   * Create a new review
   */
  static async create(
    formData: IBookReviewFormData,
  ): Promise<IBookReviewServiceRO> {
    try {
      // TODO: think about ideal flow:
      // 1. check if user exists:
      //  1.1 if not => create new user + create review
      //  1.2 if yes => create review

      // Create new book review
      const insertData: TBookReviewInsert = {
        book_id: formData.book_id,
        rating: formData.rating,
        review: formData.review.trim(),
        reviewer_name: formData.reviewer_name.trim(),
      };

      // Create new book review
      const { data, error } = await supabase
        .from("book_reviews")
        .insert(insertData)
        .select();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      const reviewData = data?.[0];

      if (!reviewData) {
        throw new Error("No data returned from insert");
      }

      return {
        data: reviewData,
        error: null,
      };
    } catch (error) {
      console.error("BookReviewsService.create error:", error);

      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Get all book reviews
   */
  static async getBookReviews(bookId: string): Promise<IBookReviewListRO> {
    try {
      const { data, error } = await supabase
        .from("book_reviews")
        .select("*")
        .eq("book_id", bookId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      return {
        data,
        error: null,
      };
    } catch (error) {
      console.error("BookReviewsService.getBookReviews error:", error);

      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Update BookReview details
   */
  static async updateBookReview(
    id: string,
    updates: TBookReviewUpdate,
  ): Promise<IBookReviewServiceRO> {
    try {
      const { data, error } = await supabase
        .from("book_reviews")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        data,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }
}
