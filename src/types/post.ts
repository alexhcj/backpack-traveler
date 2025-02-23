import type { ISocial } from "./social";
import type { ITag } from "./tag";
import type { IMasonryHeights } from "./masonry";

export interface Post {
  title: string;
  image: {
    url: string;
    alt: string;
  };
  country: string;
  destination: string;
  category: string;
  slug: string;
  pubDate: Date;
  description: string;
  author: {
    name: string;
    avatar: string;
  };
  tags?: ITag[];
  socials?: ISocial[];
  masonry: {
    height?: IMasonryHeights;
    description?: boolean;
  };
}
