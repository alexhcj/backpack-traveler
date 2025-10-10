export interface ICommentFormData {
  parentId?: string;
  postSlug: string;
  name: string;
  email: string;
  message: string;
  saveAuthorData: boolean;
}
