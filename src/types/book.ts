import type { IReview } from "./review";
import type { ICategory } from "./category";

export interface Book {
  title: string;
  slug: string;
  destination: string;
  price: number;
  discount: number;
  excerpt: string;
  description: string;
  categories: ICategory[];
  pubDate: Date;
  image: {
    url: string;
    alt: string;
  };
  sections: string[];
  quantity: number;
  weight: number;
  dimensions: string[];
  reviews: IReview[];
}
