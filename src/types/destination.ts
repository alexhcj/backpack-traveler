import type { ISocial } from "./social";
import type { ECategory } from "./category";

export interface Destination {
  title: string;
  slug: string;
  pubDate: Date;
  destination: string;
  description: string;
  author: {
    name: string;
    avatar: string;
  };
  socials?: ISocial[];
  categories: ECategory[];
  image: {
    url: string;
    alt: string;
  };
}
