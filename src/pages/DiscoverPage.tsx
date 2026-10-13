import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Compass, UserRoundPlus, UserRoundCheck } from "lucide-react";
import { useState } from "react";
import { followUser, getApiError, getSuggestions } from "../lib/api";
import { Avatar } from "../components/Avatar";
import { Spinner } from "../components/Spinner";
import type { User } from "../types";

function SuggestionCard({ user }: { user: User }) {
  const queryClient = useQueryClient();
  const [following, setFollowing] = useState(false);
  const userId = user._id || user.id || user.userId || "";
  const mutation = useMutation({
    mutationFn: () => followUser(userId),
    onSuccess: () => setFollowing(value => !value),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["suggestions"] }),
  });

  return (
    <article className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4">
      <Avatar user={user} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-extrabold">{user.name || "Route member"}</p>
        <p className="truncate text-xs text-muted">{user.username ? "@" + user.username : "A new face in the community"}</p>
      </div>
      <button disabled={!userId || mutation.isPending} onClick={() => mutation.mutate()} className={"focus-ring inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition disabled:opacity-50 " + (following ? "bg-slate-100 text-slate-600" : "bg-mint text-leaf hover:bg-emerald-100")}>
        {following ? <UserRoundCheck size={14} /> : <UserRoundPlus size={14} />}
        {following ? "Following" : "Follow"}
      </button>
      {mutation.error && <span role="alert" className="sr-only">{getApiError(mutation.error)}</span>}
    </article>
  );
}

export function DiscoverPage() {
  const query = useQuery({ queryKey: ["suggestions"], queryFn: getSuggestions });
  return (
    <div className="space-y-5 pb-24 lg:pb-8">
      <section className="rounded-[28px] bg-gradient-to-br from-emerald-900 to-leaf p-7 text-white">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10"><Compass size={19} /></span>
        <h1 className="mt-4 font-display text-3xl font-extrabold">Find your people.</h1>
        <p className="mt-2 max-w-md text-sm leading-6 text-emerald-100/75">Start with a few new voices and let your feed grow from there.</p>
      </section>
      <div>
        <h2 className="font-display text-xl font-extrabold">People to follow</h2>
        <p className="mt-1 text-xs text-muted">Suggestions from the Route Posts community.</p>
      </div>
      {query.isPending && <div className="rounded-3xl bg-white"><Spinner label="Finding people" /></div>}
      {query.isError && <p role="alert" className="rounded-2xl bg-rose-50 p-5 text-sm text-rose-700">{getApiError(query.error)}</p>}
      {query.isSuccess && query.data.length === 0 && <div className="rounded-3xl bg-white p-8 text-center text-sm text-muted">No suggestions right now. Check back soon.</div>}
      {query.isSuccess && query.data.length > 0 && <div className="space-y-3">{query.data.map((user, index) => <SuggestionCard key={user._id || user.id || index} user={user} />)}</div>}
    </div>
  );
}
