import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { getApiError, getPost } from "../lib/api";
import { PostCard } from "../components/PostCard";
import { Spinner } from "../components/Spinner";

export function PostPage() {
  const { postId = "" } = useParams();
  const postQuery = useQuery({
    queryKey: ["post", postId],
    queryFn: () => getPost(postId),
    enabled: Boolean(postId),
  });

  return (
    <div className="space-y-5 pb-24 lg:pb-8">
      <Link to="/" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-500 transition hover:bg-white hover:text-leaf">
        <ArrowLeft size={17} /> Back to feed
      </Link>
      {postQuery.isPending && (
        <div className="rounded-3xl bg-white">
          <Spinner label="Loading post" />
        </div>
      )}
      {postQuery.isError && (
        <div role="alert" className="rounded-2xl bg-rose-50 p-5 text-sm text-rose-700">
          {getApiError(postQuery.error)}
        </div>
      )}
      {postQuery.isSuccess && <PostCard post={postQuery.data} openComments />}
    </div>
  );
}
