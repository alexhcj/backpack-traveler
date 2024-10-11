import type { ISocial } from "./social";
import type { ITag } from "./tag";

export interface Destination {
  title: string;
  slug: string;
  pubDate: Date;
  destination: string;
  description: string;
  author: string;
  socials?: ISocial[];
  tags?: ITag[];
  image: {
    url: string;
    alt: string;
  };
}
