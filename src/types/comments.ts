import type { CollectionEntry } from "astro:content";

export interface ICommentFormData {
  parentId?: string;
  postSlug: string;
  name: string;
  email: string;
  message: string;
  saveAuthorData: boolean;
}

export type TCommentWithChildren = CollectionEntry<"comments"> & {
  children: TCommentWithChildren[];
};
