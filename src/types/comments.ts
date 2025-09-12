// comments for posts
export interface IComment {
  parentId?: string;
  name: string;
  email: string;
  message: string;
}

export interface ICommentFormData {
  parentId?: string;
  name: string;
  email: string;
  message: string;
  saveAuthorData: boolean;
}
