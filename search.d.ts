type SearchItem = {
  title: string;
  slug: string;
};

declare global {
  interface Window {
    __SEARCH_INDEX__: SearchItem[];
  }
}
