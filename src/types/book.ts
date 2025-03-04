import type { IReview } from "./review";
import type { ECategory } from "./category";

enum EBookTag {
  SALE = "sale",
  NEW = "new",
}

export interface Book {
  title: string;
  slug: string;
  destination: string;
  price: number;
  discount?: number;
  excerpt: string;
  description: string;
  categories: ECategory[];
  tag?: EBookTag;
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
