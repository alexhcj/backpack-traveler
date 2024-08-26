import type { ISocial } from "./social";

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
  author: string;
  tags?: string[];
  socials?: ISocial[];
}
