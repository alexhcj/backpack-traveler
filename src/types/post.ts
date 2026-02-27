import type { ISocial } from "./social";
import type { ECategory } from "./category";
import type { IMasonryHeights } from "./masonry";
import type { Coordinates } from "./map";

export interface Post {
  title: string;
  image: {
    url: string;
    alt: string;
  };
  country: string;
  destination: string;
  categories: ECategory[];
  slug: string;
  pubDate: Date;
  description: string;
  likesCount?: number;
  author: {
    name: string;
    avatar: string;
  };
  socials?: ISocial[];
  masonry?: {
    height: IMasonryHeights;
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
