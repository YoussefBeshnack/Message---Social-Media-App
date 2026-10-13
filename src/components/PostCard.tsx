import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, Send, ThumbsUp, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createComment, deleteComment, deletePost, getApiError, getComments, togglePostLike, updateComment, updatePost } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { Comment as CommentType, Post, User } from "../types";
import { Avatar } from "./Avatar";
import { Spinner } from "./Spinner";

function authorOf(post: Post): User | null {
  return (post.user || post.author || null) as User | null;
}

function labelFor(user?: User | null) {
  return user?.name || (user?.username ? "@" + user.username : "Route member");
}

function initialsFor(user?: User | null) {
  return user?.username ? "@" + user.username : "community";
}

function relativeDate(value?: string) {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

function identity(value?: User | null) {
  return value?._id || value?.id || value?.userId || "";
}

function likedByCurrentUser(post: Post, currentUserId: string) {
  if (post.isLiked || post["likedByMe"]) return true;
  if (!currentUserId || !Array.isArray(post.likes)) return false;
  return post.likes.some((like) => {
    if (typeof like === "string") return like === currentUserId;
    if (!like || typeof like !== "object") return false;
    const record = like as Record<string, unknown>;
    const user = record.user && typeof record.user === "object" ? (record.user as Record<string, unknown>) : undefined;
    return [record._id, record.id, record.userId, user?._id, user?.id, user?.userId].some((id) => id === currentUserId);
  });
}

function CommentRow({ comment, postId }: { comment: CommentType; postId: string }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content || comment.body || "");
  const author = (comment.commentCreator || comment.user || null) as User | null;
  const commentId = comment._id || comment.id || "";
  const mine = Boolean(user && identity(user) && identity(author) === identity(user));
  const remove = useMutation({ mutationFn: () => deleteComment(postId, commentId), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["comments", postId] }) });
  const save = useMutation({
    mutationFn: () => updateComment(postId, commentId, draft.trim()),
    onSuccess: async () => {
      setEditing(false);
      await queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    },
  });
  return (
    <div className="flex gap-2.5">
      <Avatar user={author} size="sm" />
      <div className="min-w-0 flex-1 rounded-2xl bg-slate-50 px-3.5 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold">{labelFor(author)}</p>
          {mine && (
            <div className="flex gap-2 text-slate-400">
              <button aria-label="Edit comment" onClick={() => setEditing((v) => !v)}>
                <Pencil size={13} />
              </button>
              <button
                aria-label="Delete comment"
                onClick={() => {
                  if (window.confirm("Delete this comment?")) remove.mutate();
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </div>
        {editing ? (
          <form
            className="mt-2 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              save.mutate();
            }}
          >
            <input className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-1 text-sm" value={draft} onChange={(event) => setDraft(event.target.value)} />
            <button className="text-xs font-bold text-leaf" disabled={save.isPending}>
              Save
            </button>
          </form>
        ) : (
          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-5 text-slate-600">{comment.content || comment.body || ""}</p>
        )}
        {(remove.error || save.error) && (
          <p role="alert" className="mt-1 text-xs text-rose-600">
            {getApiError(remove.error || save.error)}
          </p>
        )}
      </div>
    </div>
  );
}

const commentSchema = z.object({
  content: z.string().trim().min(1, "Write a comment first.").max(1000, "Keep your comment under 1,000 characters."),
});

function CommentComposer({ postId }: { postId: string }) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ content: string }>({
    resolver: zodResolver(commentSchema),
    defaultValues: { content: "" },
  });

  const mutation = useMutation({
    mutationFn: (content: string) => createComment(postId, content),
    onSuccess: async () => {
      reset();
      await queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      await queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  return (
    <form onSubmit={handleSubmit((values) => mutation.mutate(values.content))} className="mt-4">
      <div className="flex gap-2">
        <input
          aria-label="Write a comment"
          placeholder="Add a kind thought…"
          className="focus-ring min-w-0 flex-1 rounded-full bg-slate-100 px-4 py-2.5 text-xs outline-none placeholder:text-slate-400"
          {...register("content")}
        />
        <button
          aria-label="Send comment"
          disabled={mutation.isPending}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-leaf text-white transition hover:bg-emerald-800 disabled:opacity-50"
        >
          <Send size={15} />
        </button>
      </div>
      {errors.content && (
        <p role="alert" className="mt-1.5 text-xs text-rose-600">
          {errors.content.message}
        </p>
      )}
      {mutation.error && (
        <p role="alert" className="mt-1.5 text-xs text-rose-600">
          {getApiError(mutation.error)}
        </p>
      )}
    </form>
  );
}

export function PostCard({ post, openComments = false }: { post: Post; openComments?: boolean }) {
  const queryClient = useQueryClient();
  const { token, user } = useAuth();
  const [commentsOpen, setCommentsOpen] = useState(openComments);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(post.body || "");
  const [draftImage, setDraftImage] = useState<File>();
  const author = authorOf(post);
  const authorId = identity(author);
  const postId = post._id || post.id || "";
  const likes = Array.isArray(post.likes) ? post.likes.length : Number(post["likesCount"] || 0);
  const liked = likedByCurrentUser(post, identity(user));
  const mine = Boolean(user && identity(user) && identity(author) === identity(user));

  const removePost = useMutation({
    mutationFn: () => deletePost(postId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["posts"] });
      await queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });
  const savePost = useMutation({
    mutationFn: () => updatePost(postId, draft.trim(), draftImage),
    onSuccess: async () => {
      setEditing(false);
      await queryClient.invalidateQueries({ queryKey: ["posts"] });
      await queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });

  const commentsQuery = useQuery({
    queryKey: ["comments", postId],
    queryFn: () => getComments(postId),
    enabled: commentsOpen && Boolean(postId),
  });

  const likeMutation = useMutation({
    mutationFn: () => togglePostLike(postId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["posts"] });
      await queryClient.invalidateQueries({ queryKey: ["post", postId] });
      await queryClient.invalidateQueries({ queryKey: ["user-posts"] });
    },
  });

  return (
    <article className="soft-shadow overflow-hidden rounded-[28px] border border-emerald-950/5 bg-white">
      <div className="flex items-start gap-3 px-5 pt-5 sm:px-6 sm:pt-6">
        {authorId ? (
          <Link to={"/profile/" + authorId} aria-label={`Open ${labelFor(author)}'s profile`} className="shrink-0 rounded-full focus-ring">
            <Avatar user={author} />
          </Link>
        ) : (
          <Avatar user={author} />
        )}
        <div className="min-w-0 flex-1 pt-0.5">
          {authorId ? (
            <Link to={"/profile/" + authorId} className="block truncate text-sm font-extrabold hover:text-leaf">
              {labelFor(author)}
            </Link>
          ) : (
            <p className="truncate text-sm font-extrabold">{labelFor(author)}</p>
          )}
          <p className="mt-1 text-xs text-muted">
            {initialsFor(author)} <span className="px-1">·</span>
            <Link to={"/posts/" + postId} className="hover:text-leaf">
              {relativeDate(post.createdAt)}
            </Link>
          </p>
        </div>
        {mine && (
          <div className="flex items-center gap-1">
            <button aria-label="Edit post" title="Edit post" onClick={() => setEditing((v) => !v)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100">
              <Pencil size={16} />
            </button>
            <button
              aria-label="Delete post"
              title="Delete post"
              onClick={() => {
                if (window.confirm("Delete this post?")) removePost.mutate();
              }}
              className="rounded-full p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {editing && (
        <form
          className="space-y-2 px-5 pt-4 sm:px-6"
          onSubmit={(event) => {
            event.preventDefault();
            savePost.mutate();
          }}
        >
          <textarea aria-label="Edit post text" className="w-full rounded-xl border border-slate-200 p-3 text-sm" rows={3} value={draft} onChange={(event) => setDraft(event.target.value)} />
          <input aria-label="Replace post image" type="file" accept="image/*" onChange={(event) => setDraftImage(event.target.files?.[0])} className="block w-full text-xs" />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditing(false)} className="rounded-lg px-3 py-2 text-xs font-bold text-slate-500">
              Cancel
            </button>
            <button disabled={savePost.isPending || !draft.trim()} className="rounded-lg bg-leaf px-3 py-2 text-xs font-bold text-white">
              {savePost.isPending ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      )}
      {(removePost.error || savePost.error) && (
        <p role="alert" className="px-5 pt-2 text-xs text-rose-600">
          {getApiError(removePost.error || savePost.error)}
        </p>
      )}

      {post.body && <p className="whitespace-pre-wrap px-5 py-4 text-sm leading-7 text-slate-700 sm:px-6">{post.body}</p>}
      {post.image && <img src={post.image} alt="Post attachment" className="max-h-[520px] w-full mt-2 bg-slate-50 object-cover" loading="lazy" />}

      <div className="flex items-center justify-between px-5 py-3 text-xs text-muted sm:px-6">
        <span className="inline-flex items-center gap-1.5">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-100 text-leaf">
            <ThumbsUp size={11} fill="currentColor" />
          </span>
          {likes} {likes === 1 ? "like" : "likes"}
        </span>
        <button onClick={() => setCommentsOpen((value) => !value)} className="hover:text-leaf">
          {Number(post["commentsCount"] || (Array.isArray(post.comments) ? post.comments.length : 0))} comments
        </button>
      </div>

      <div className="mx-5 border-t border-slate-100 sm:mx-6" />
      <div className="grid grid-cols-2 gap-2 px-4 py-2">
        <button
          onClick={() => likeMutation.mutate()}
          disabled={!token || likeMutation.isPending}
          aria-pressed={liked}
          className={
            "focus-ring flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition hover:bg-slate-50 disabled:opacity-50 " + (liked ? "text-rose-600" : "text-slate-500")
          }
        >
          <Heart size={17} fill={liked ? "currentColor" : "none"} /> {liked ? "Liked" : "Like"}
        </button>
        <button
          onClick={() => setCommentsOpen((value) => !value)}
          aria-expanded={commentsOpen}
          className="focus-ring flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold text-slate-500 transition hover:bg-slate-50"
        >
          <MessageCircle size={17} /> {commentsOpen ? "Hide comments" : "Comment"}
        </button>
      </div>

      {likeMutation.error && (
        <p role="alert" className="px-6 pb-2 text-xs text-rose-600">
          {getApiError(likeMutation.error)}
        </p>
      )}

      {commentsOpen && (
        <section aria-label="Comments" className="border-t border-slate-100 bg-white px-5 py-4 sm:px-6">
          {commentsQuery.isPending && <Spinner label="Gathering comments" />}
          {commentsQuery.isError && (
            <p role="alert" className="text-sm text-rose-600">
              {getApiError(commentsQuery.error)}
            </p>
          )}
          {commentsQuery.isSuccess &&
            (commentsQuery.data.length > 0 ? (
              <div className="space-y-3">
                {commentsQuery.data.map((comment) => (
                  <CommentRow key={comment._id || comment.id} comment={comment} postId={postId} />
                ))}
              </div>
            ) : (
              <p className="py-2 text-sm text-muted">No comments yet. Start the conversation.</p>
            ))}
          <CommentComposer postId={postId} />
        </section>
      )}
    </article>
  );
}
