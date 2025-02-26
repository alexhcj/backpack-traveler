import type { ISocial } from "./social";
import type { ICategory } from "./category";

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
  categories: ICategory[];
  image: {
    url: string;
    alt: string;
  };
}
