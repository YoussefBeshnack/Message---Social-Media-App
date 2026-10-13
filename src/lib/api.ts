import axios from "axios";
import type { ApiEnvelope, AuthPayload, Comment, LoginValues, NotificationItem, Post, SignupValues, User } from "../types";

export const api = axios.create({
  baseURL: "https://route-posts.routemisr.com",
  headers: { Accept: "application/json" },
  timeout: 20_000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("route-social-token");
  if (token) config.headers.Authorization = "Bearer " + token;
  return config;
});

export function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiEnvelope<unknown> | undefined;
    if (data?.message) return data.message;
    if (typeof data?.errors === "string") return data.errors;
    if (error.response?.status === 401) return "Your session expired. Please sign in again.";
    if (error.message === "Network Error") return "Could not reach the API. Check your connection.";
    return error.message || "The request failed. Please try again.";
  }
  return error instanceof Error ? error.message : "Something went wrong.";
}

function unwrap<T>(payload: ApiEnvelope<T> | T): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as ApiEnvelope<T>).data as T;
  }
  return payload as T;
}

export async function signup(values: SignupValues): Promise<AuthPayload> {
  const response = await api.post<ApiEnvelope<AuthPayload>>("/users/signup", values);
  return unwrap(response.data);
}

export async function signin(values: LoginValues): Promise<AuthPayload> {
  const response = await api.post<ApiEnvelope<AuthPayload>>("/users/signin", values);
  return unwrap(response.data);
}

export async function getPosts(): Promise<Post[]> {
  const response = await api.get<ApiEnvelope<Post[] | { posts?: Post[] }>>("/posts");
  const data = unwrap(response.data);
  if (Array.isArray(data)) return data;
  return data?.posts ?? [];
}

export async function getPost(postId: string): Promise<Post> {
  const response = await api.get<ApiEnvelope<Post | { post?: Post }>>("/posts/" + postId);
  const data = unwrap(response.data);
  return ("post" in data ? data.post : data) as Post;
}

export async function getComments(postId: string): Promise<Comment[]> {
  const all: Comment[] = [];
  const limit = 50;
  for (let page = 1; page <= 100; page += 1) {
    const response = await api.get<ApiEnvelope<Comment[] | { comments?: Comment[] }>>(
      "/posts/" + postId + "/comments", { params: { page, limit } }
    );
    const data = unwrap(response.data);
    const batch = Array.isArray(data) ? data : data?.comments ?? [];
    all.push(...batch);
    if (batch.length < limit) break;
  }
  return all;
}

export async function createPost(body: string, image?: File): Promise<Post> {
  const form = new FormData();
  form.append("body", body);
  if (image) form.append("image", image);
  const response = await api.post<ApiEnvelope<Post | { post?: Post }>>("/posts", form);
  const data = unwrap(response.data);
  return ("post" in data ? data.post : data) as Post;
}

export async function updatePost(postId: string, body: string, image?: File): Promise<void> {
  const form = new FormData();
  form.append("body", body);
  if (image) form.append("image", image);
  await api.put("/posts/" + postId, form);
}

export async function deletePost(postId: string): Promise<void> {
  await api.delete("/posts/" + postId);
}

export async function togglePostLike(postId: string): Promise<void> {
  await api.put("/posts/" + postId + "/like");
}

export async function createComment(postId: string, content: string): Promise<Comment> {
  const form = new FormData();
  form.append("content", content);
  const response = await api.post<ApiEnvelope<Comment | { comment?: Comment }>>(
    "/posts/" + postId + "/comments",
    form
  );
  const data = unwrap(response.data);
  return ("comment" in data ? data.comment : data) as Comment;
}

export async function updateComment(postId: string, commentId: string, content: string): Promise<void> {
  const form = new FormData();
  form.append("content", content);
  await api.put(`/posts/${postId}/comments/${commentId}`, form);
}

export async function deleteComment(postId: string, commentId: string): Promise<void> {
  await api.delete(`/posts/${postId}/comments/${commentId}`);
}

export async function getProfile(userId: string): Promise<User> {
  const response = await api.get<ApiEnvelope<User | { user?: User }>>(`/users/${userId}/profile`);
  const data = unwrap(response.data);
  return ("user" in data ? data.user : data) as User;
}

export async function getCurrentProfile(): Promise<User> {
  const response = await api.get<ApiEnvelope<User | { user?: User }>>("/users/profile-data");
  const data = unwrap(response.data);
  return ("user" in data ? data.user : data) as User;
}

export async function uploadProfilePhoto(photo: File): Promise<User | undefined> {
  const form = new FormData();
  form.append("photo", photo);
  const response = await api.put<ApiEnvelope<User | { user?: User }>>("/users/upload-photo", form);
  const data = unwrap(response.data);
  if (data && typeof data === "object" && "user" in data) return data.user as User | undefined;
  return data && typeof data === "object" ? data as User : undefined;
}

export async function getUserPosts(userId: string): Promise<Post[]> {
  const response = await api.get<ApiEnvelope<Post[] | { posts?: Post[] }>>(`/users/${userId}/posts`);
  const data = unwrap(response.data);
  return Array.isArray(data) ? data : data?.posts ?? [];
}

export async function changePassword(password: string, newPassword: string): Promise<AuthPayload> {
  const response = await api.patch<ApiEnvelope<AuthPayload>>("/users/change-password", { password, newPassword });
  return unwrap(response.data);
}

export async function getSuggestions(): Promise<User[]> {
  const response = await api.get<ApiEnvelope<User[] | { users?: User[] }>>("/users/suggestions", {
    params: { limit: 10 },
  });
  const data = unwrap(response.data);
  if (Array.isArray(data)) return data;
  return data?.users ?? [];
}

export async function followUser(userId: string): Promise<void> {
  await api.put("/users/" + userId + "/follow");
}

export async function getNotifications(): Promise<NotificationItem[]> {
  const response = await api.get<ApiEnvelope<NotificationItem[] | { notifications?: NotificationItem[] }>>(
    "/notifications",
    { params: { unread: false, page: 1, limit: 20 } }
  );
  const data = unwrap(response.data);
  if (Array.isArray(data)) return data;
  return data?.notifications ?? [];
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await api.patch("/notifications/" + notificationId + "/read");
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.patch("/notifications/read-all");
}
