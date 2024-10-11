import type { IReview } from "./review";
import type { ITag } from "./tag";

export interface Book {
  title: string;
  slug: string;
  destination: string;
  price: number;
  discount: number;
  excerpt: string;
  description: string;
  category: string;
  pubDate: Date;
  image: {
    url: string;
    alt: string;
  };
  sections: string[];
  tags: ITag[];
  quantity: number;
  weight: number;
  dimensions: string[];
  reviews: IReview[];
}
