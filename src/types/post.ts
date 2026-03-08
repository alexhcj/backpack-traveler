import type { ISocial } from "./social";
import type { ECategory } from "./category";
import type { IMasonryHeights } from "./masonry";
import type { Coordinates } from "./map";

export interface Post {
  title: string;
  slug: string;
  country: string;
  destination: string;
  categories: ECategory[];
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
  };
  image: {
    url: string;
    alt: string;
  };
  previewImage?: {
    url: string;
    alt: string;
  };
  video?: {
    url: string;
    format: string;
  };
  coordinates: Coordinates | Coordinates[]; // array if multiple places in post
}
