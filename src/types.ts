// These interfaces describe the parts of the API responses the UI consumes.
// Extra server fields are allowed so a backend addition does not break the app.
export interface ApiEnvelope<T> {
  success?: boolean;
  message?: string;
  data?: T;
  meta?: { [key: string]: unknown };
  errors?: unknown;
}

export interface User {
  _id?: string;
  id?: string;
  userId?: string;
  name?: string;
  username?: string;
  email?: string;
  photo?: string;
  profilePhoto?: string;
  [key: string]: unknown;
}

export interface AuthPayload {
  token?: string;
  user?: User;
  userId?: string;
  [key: string]: unknown;
}

export interface PostAuthor {
  _id?: string;
  id?: string;
  name?: string;
  username?: string;
  photo?: string;
  profilePhoto?: string;
  [key: string]: unknown;
}

export interface Post {
  _id: string;
  id?: string;
  body?: string;
  image?: string | null;
  createdAt?: string;
  updatedAt?: string;
  user?: PostAuthor;
  author?: PostAuthor;
  comments?: Comment[];
  likes?: unknown[];
  isLiked?: boolean;
  [key: string]: unknown;
}

export interface CommentAuthor {
  _id?: string;
  id?: string;
  name?: string;
  username?: string;
  photo?: string;
  profilePhoto?: string;
  [key: string]: unknown;
}

export interface Comment {
  _id: string;
  id?: string;
  content?: string;
  body?: string;
  image?: string | null;
  createdAt?: string;
  commentCreator?: CommentAuthor;
  user?: CommentAuthor;
  replies?: Comment[];
  [key: string]: unknown;
}

export interface NotificationItem {
  _id: string;
  id?: string;
  message?: string;
  type?: string;
  read?: boolean;
  isRead?: boolean;
  createdAt?: string;
  [key: string]: unknown;
}

export interface SignupValues {
  name: string;
  username: string;
  email: string;
  dateOfBirth: string;
  gender: "male" | "female";
  password: string;
  rePassword: string;
}

export interface LoginValues {
  email: string;
  password: string;
}
