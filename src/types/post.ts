import type { ISocial } from "./social";
import type { ITag } from "./tag";

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
}
