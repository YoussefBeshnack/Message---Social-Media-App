import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { getApiError, getNotifications, markAllNotificationsRead, markNotificationRead } from "../lib/api";
import { Spinner } from "../components/Spinner";

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["notifications"], queryFn: getNotifications });
  const markOne = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const markAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <div className="space-y-5 pb-24 lg:pb-8">
      <section className="flex items-end justify-between gap-4 rounded-[28px] bg-[#123d32] p-7 text-white">
        <div>
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10"><Bell size={19} /></span>
          <h1 className="mt-4 font-display text-3xl font-extrabold">Your notifications</h1>
          <p className="mt-2 text-sm text-emerald-100/75">A quick look at what's happening around you.</p>
        </div>
        <button onClick={() => markAll.mutate()} disabled={markAll.isPending} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white/10 px-3 py-2.5 text-xs font-bold transition hover:bg-white/15 disabled:opacity-50"><CheckCheck size={15} /> Mark all read</button>
      </section>
      {query.isPending && <div className="rounded-3xl bg-white"><Spinner label="Loading notifications" /></div>}
      {query.isError && <p role="alert" className="rounded-2xl bg-rose-50 p-5 text-sm text-rose-700">{getApiError(query.error)}</p>}
      {query.isSuccess && query.data.length === 0 && <div className="rounded-3xl bg-white p-10 text-center text-sm text-muted">You're all caught up.</div>}
      {query.isSuccess && query.data.length > 0 && (
        <div className="soft-shadow divide-y divide-slate-100 rounded-3xl bg-white px-5">
          {query.data.map(item => {
            const isRead = Boolean(item.read || item.isRead);
            return (
              <article key={item._id || item.id} className="flex items-center gap-4 py-4">
                <span className={"grid h-10 w-10 shrink-0 place-items-center rounded-full " + (isRead ? "bg-slate-100 text-slate-400" : "bg-mint text-leaf")}><Bell size={17} /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-700">{item.message || "You have a new notification."}</p>
                  {item.createdAt && <p className="mt-1 text-xs text-muted">{new Date(item.createdAt).toLocaleString()}</p>}
                </div>
                {!isRead && <button onClick={() => markOne.mutate(item._id || item.id || "")} disabled={markOne.isPending} className="rounded-lg px-2 py-1 text-xs font-bold text-leaf hover:bg-mint">Mark read</button>}
              </article>
            );
          })}
          {(markOne.error || markAll.error) && <p role="alert" className="py-3 text-sm text-rose-600">{getApiError(markOne.error || markAll.error)}</p>}
        </div>
      )}
    </div>
  );
}
