import { useQuery } from "@tanstack/react-query";
import { ArrowDownWideNarrow, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { getApiError, getPosts } from "../lib/api";
import { PostComposer } from "../components/PostComposer";
import { PostCard } from "../components/PostCard";
import { Spinner } from "../components/Spinner";

export function FeedPage() {
  const [search, setSearch] = useState("");
  const postsQuery = useQuery({ queryKey: ["posts"], queryFn: getPosts });

  const visiblePosts = useMemo(() => {
    const posts = postsQuery.data ?? [];
    const phrase = search.trim().toLowerCase();
    if (!phrase) return posts;
    return posts.filter((post) => {
      const author = post.user?.name || post.author?.name || post.user?.username || "";
      return (post.body || "").toLowerCase().includes(phrase) || author.toLowerCase().includes(phrase);
    });
  }, [postsQuery.data, search]);

  return (
    <div className="space-y-5 pb-24 lg:pb-8">
      <PostComposer />

      <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-extrabold">The feed</h2>
          <p className="mt-1 text-xs text-muted">A fresh look at what everyone is sharing.</p>
        </div>
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-400 sm:max-w-[230px]">
          <Search size={15} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search this feed"
            className="min-w-0 flex-1 bg-transparent text-xs text-ink outline-none placeholder:text-slate-400"
          />
        </label>
      </div>

      {postsQuery.isPending && (
        <div className="soft-shadow rounded-3xl bg-white">
          <Spinner label="Loading the feed" />
        </div>
      )}
      {postsQuery.isError && (
        <div className="rounded-3xl border border-rose-100 bg-white p-6">
          <p className="font-bold text-rose-700">We couldn't load the feed.</p>
          <p className="mt-1 text-sm text-slate-500">{getApiError(postsQuery.error)}</p>
          <button onClick={() => postsQuery.refetch()} className="mt-4 rounded-xl bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100">
            Try again
          </button>
        </div>
      )}
      {postsQuery.isSuccess && visiblePosts.length === 0 && (
        <div className="rounded-3xl border border-dashed border-emerald-200 bg-white px-6 py-12 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-mint text-leaf">
            <ArrowDownWideNarrow size={21} />
          </span>
          <h3 className="mt-4 font-display font-extrabold">{search ? "No matches yet" : "The feed is quiet"}</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-muted">{search ? "Try another search term." : "Share the first post or discover people to follow."}</p>
        </div>
      )}
      {postsQuery.isSuccess && visiblePosts.length > 0 && (
        <div className="space-y-5">
          {visiblePosts.map((post) => (
            <PostCard key={post._id || post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
