export interface Post {
  title: string;
  image: {
    url: string;
    alt: string;
  };
  place: string;
  category: string;
  slug: string;
  pubDate: Date;
  description: string;
  author: string;
  tags?: string[];
}
