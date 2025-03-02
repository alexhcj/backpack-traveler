import type { ISocial } from "./social";
import type { ICategory } from "./category";
import type { IMasonryHeights } from "./masonry";

export interface Post {
  title: string;
  image: {
    url: string;
    alt: string;
  };
  country: string;
  destination: string;
  categories: ICategory[];
  slug: string;
  pubDate: Date;
  description: string;
  likesCount: number;
  author: {
    name: string;
    avatar: string;
  };
  socials?: ISocial[];
  masonry?: {
    height: IMasonryHeights;
    description?: boolean;
  };
}
