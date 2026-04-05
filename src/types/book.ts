// import type { ECategory } from "./category";
import type { InsertTables, Tables, UpdateTables } from "./database";
import type { TBookReview } from "./review";

export type TBook = Tables<"books">;
export type TBookWithRating = TBook & {
  rating: number;
  review_count: number;
  book_reviews: TBookReview[] | [];
};
export type TBookInsert = InsertTables<"books">;
export type TBookUpdate = UpdateTables<"books">;

export interface IBookFormData {
  id: string;
  sku: string;
  slug: string;
  title: string;
  destination: string;
  description: string;
  excerpt: string;
  chapters: string[];
  price: number;
  discount?: number;
  quantity: number;
  published_date?: string;
  cover_image?: string;
  tags?: string[];
  weight_g?: number;
  width_mm?: number;
  height_mm?: number;
  length_mm?: number;
}

export interface IBookServiceRO<T = TBook> {
  data: T | null;
  error: Error | null;
}

export interface IBookListRO<T = TBook> {
  data: T[] | null;
  error: Error | null;
}

export interface IBook {
  id: string;
  sku: string;
  title: string;
  destination: string;
  description: string;
  excerpt: string;
  chapters: string[];
  price: number;
  discount: number;
  quantity: number;
  image: {
    url: string;
    alt: string;
  };
  tags: string[]; // TODO: replace to enum
  parameters: {
    weight: string;
    dimensions: string;
  };
  book_reviews: TBookReview[];
  rating: number;
  review_count: number;
}
