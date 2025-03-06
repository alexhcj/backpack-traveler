import type { ISocial } from "./social";

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
  image: {
    url: string;
    alt: string;
  };
}
