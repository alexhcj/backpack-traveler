import { supabase } from "../supabase";
import type {
  IBookFormData,
  IBookListRO,
  IBookServiceRO,
  TBookInsert,
  TBookUpdate,
  TBookWithRating,
} from "../../types/book";

export class BooksService {
  /**
   * Create a new book
   */
  static async create(formData: IBookFormData): Promise<IBookServiceRO> {
    try {
      // Create new book
      const insertData: TBookInsert = {
        sku: formData.sku,
        slug: formData.slug,
        title: formData.title,
        destination: formData.destination,
        description: formData.description,
        excerpt: formData.excerpt,
        chapters: formData.chapters,
        price: formData.price,
        quantity: formData.quantity,
      };

      // Create new book
      const { data, error } = await supabase
        .from("books")
        .insert(insertData)
        .select();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      const Data = data?.[0];

      if (!Data) {
        throw new Error("No data returned from insert");
      }

      return {
        data: Data,
        error: null,
      };
    } catch (error) {
      console.error("BooksService.create error:", error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Get book by id
   */
  static async getById(id: string): Promise<IBookServiceRO> {
    try {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      if (!data) {
        throw new Error("No data returned from select");
      }

      return {
        data,
        error: null,
      };
    } catch (error) {
      console.error("BooksService.getById error:", error);

      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Get book by id with reviews
   */
  static async getByIdWithReviews(
    id: string,
  ): Promise<IBookServiceRO<TBookWithRating>> {
    try {
      const { data, error } = await supabase
        .from("books_with_ratings")
        .select("*, book_reviews(*)")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      if (!data) {
        throw new Error("No data returned from select");
      }

      return {
        data: data as unknown as TBookWithRating,
        error: null,
      };
    } catch (error) {
      console.error("BooksService.getByIdWithReviews error:", error);

      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Get all books
   */
  static async getAll(): Promise<IBookListRO> {
    try {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .order("created_at", { ascending: false });

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

  /**
   * Get all books with rating
   */
  static async getAllWithRating(): Promise<IBookListRO<TBookWithRating>> {
    try {
      const { data, error } = await supabase
        .from("books_with_ratings")
        .select("*");

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      return {
        data: data as unknown as TBookWithRating[],
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Get books data for generating static paths
   */
  static async getForStaticPaths(): Promise<
    IBookServiceRO<{ slug: string; id: string }[]>
  > {
    try {
      const { data, error } = await supabase.from("books").select("slug, id");

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      if (!data) {
        throw new Error("No data returned from select");
      }

      return {
        data,
        error: null,
      };
    } catch (error) {
      console.error("BooksService.getForStaticPaths error:", error);

      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Update Book details
   */
  static async updateBook(
    id: string,
    updates: TBookUpdate,
  ): Promise<IBookServiceRO> {
    try {
      const { data, error } = await supabase
        .from("books")
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
