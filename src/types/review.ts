import type { InsertTables, Tables, UpdateTables } from "./database";

export type TBookReview = Tables<"book_reviews">;
export type TBookReviewInsert = InsertTables<"book_reviews">;
export type TBookReviewUpdate = UpdateTables<"book_reviews">;

export interface IBookReviewFormData {
  book_id: string;
  rating: number;
  review: string;
  reviewer_name: string;
  email: string;
}

export interface IBookReviewServiceRO<T = TBookReview> {
  data: T | null;
  error: Error | null;
}

export interface IBookReviewListRO {
  data: TBookReview[] | null;
  error: Error | null;
}
