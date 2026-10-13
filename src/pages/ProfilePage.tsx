import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, ImagePlus, UserRound, UserRoundCheck, UserRoundPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { followUser, getApiError, getCurrentProfile, getProfile, getUserPosts, uploadProfilePhoto } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Avatar } from "../components/Avatar";
import { PostCard } from "../components/PostCard";
import { Spinner } from "../components/Spinner";
import type { User } from "../types";

function idsFromList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .map((entry) => {
      if (typeof entry === "string") return entry;
      if (!entry || typeof entry !== "object") return "";
      const item = entry as Record<string, unknown>;
      const nested = item.user && typeof item.user === "object" ? (item.user as Record<string, unknown>) : undefined;
      return String(item._id || item.id || item.userId || nested?._id || nested?.id || nested?.userId || "");
    })
    .filter(Boolean);
}

function followingIds(profile?: User): string[] | undefined {
  if (!profile) return undefined;
  for (const key of ["following", "followings", "followingUsers", "followingList", "followedUsers"]) {
    const ids = idsFromList(profile[key]);
    if (ids) return ids;
  }
  return undefined;
}

export function ProfilePage() {
  const { userId: routeId } = useParams();
  const { user, signInWith } = useAuth();
  const queryClient = useQueryClient();
  const signedInUserId = user?._id || user?.id || user?.userId || "";
  const userId = routeId || signedInUserId;
  const isOwnProfile = Boolean(signedInUserId && signedInUserId === userId);
  const profile = useQuery({ queryKey: ["profile", userId], queryFn: () => (isOwnProfile ? getCurrentProfile() : getProfile(userId)), enabled: Boolean(userId) });
  const viewerProfile = useQuery({ queryKey: ["profile", "viewer", signedInUserId], queryFn: getCurrentProfile, enabled: Boolean(signedInUserId && !isOwnProfile) });
  const posts = useQuery({ queryKey: ["user-posts", userId], queryFn: () => getUserPosts(userId), enabled: Boolean(userId) });
  const [banner, setBanner] = useState(() => localStorage.getItem(`route-social-banner-${userId}`) || "");
  const [uploadError, setUploadError] = useState("");
  const photoMutation = useMutation({
    mutationFn: uploadProfilePhoto,
    onSuccess: async (updatedUser) => {
      if (updatedUser) signInWith({ user: { ...user, ...updatedUser } });
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
  const [following, setFollowing] = useState(false);
  useEffect(() => {
    const status = [profile.data?.isFollowing, profile.data?.isFollowed, profile.data?.followedByMe, profile.data?.isFollowedByMe].find((value) => typeof value === "boolean");
    const ids = followingIds(viewerProfile.data);
    let remembered: string[] = [];
    try {
      remembered = JSON.parse(localStorage.getItem(`route-social-following-${signedInUserId}`) || "[]") as string[];
    } catch {
      /* Ignore a malformed local cache and use server data. */
    }
    if (typeof status === "boolean") setFollowing(status);
    else if (ids) setFollowing(ids.includes(userId));
    else setFollowing(remembered.includes(userId));
  }, [profile.data, viewerProfile.data, userId, signedInUserId]);
  const followMutation = useMutation({
    mutationFn: () => followUser(userId),
    onSuccess: async () => {
      const nextFollowing = !following;
      setFollowing(nextFollowing);
      try {
        const remembered = JSON.parse(localStorage.getItem(`route-social-following-${signedInUserId}`) || "[]") as string[];
        const next = nextFollowing ? Array.from(new Set([...remembered, userId])) : remembered.filter((id) => id !== userId);
        localStorage.setItem(`route-social-following-${signedInUserId}`, JSON.stringify(next));
      } catch {}
      queryClient.setQueryData(["profile", userId], (current: User | undefined) =>
        current
          ? {
              ...current,
              isFollowing: nextFollowing,
              ...(typeof current.followersCount === "number" ? { followersCount: Math.max(0, current.followersCount + (following ? -1 : 1)) } : {}),
            }
          : current,
      );
      await queryClient.invalidateQueries({ queryKey: ["profile", "viewer", signedInUserId] });
    },
  });

  async function saveBanner(file?: File) {
    if (!file) return;
    setUploadError("");
    const image = new Image();
    const source = URL.createObjectURL(file);
    image.src = source;
    try {
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Could not read this image."));
      });
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 1400 / image.width, 420 / image.height);
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
      const data = canvas.toDataURL("image/jpeg", 0.78);
      localStorage.setItem(`route-social-banner-${userId}`, data);
      setBanner(data);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Could not save the banner image.");
    } finally {
      URL.revokeObjectURL(source);
    }
  }

  if (!userId) return <div className="rounded-3xl bg-white p-6 text-sm">Your account response did not include a user ID, so the profile endpoint cannot be opened. Try signing in again.</div>;
  return (
    <div className="space-y-5 pb-24 lg:pb-8">
      <section className="soft-shadow overflow-hidden rounded-[28px] border border-emerald-950/5 bg-white">
        <div
          className="relative h-40 bg-gradient-to-br from-emerald-950 via-emerald-800 to-emerald-600 sm:h-52"
          style={banner ? { backgroundImage: `url(${banner})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
        >
          {isOwnProfile && (
            <label className="absolute bottom-3 right-3 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white/90 px-3 py-2 text-xs font-bold text-ink shadow">
              <ImagePlus size={15} /> Change banner
              <input className="sr-only" type="file" accept="image/*" onChange={(event) => void saveBanner(event.target.files?.[0])} />
            </label>
          )}
        </div>
        <div className="px-6 pb-6 sm:px-8 sm:pb-8">
          {profile.isPending ? (
            <div className="pt-6">
              <Spinner label="Loading profile" />
            </div>
          ) : profile.isError ? (
            <p role="alert" className="pt-6 text-sm text-rose-600">
              {getApiError(profile.error)}
            </p>
          ) : (
            <>
              <div className="-mt-9 flex flex-wrap items-end justify-between gap-4">
                <div className="relative rounded-full bg-white p-1.5">
                  <Avatar user={profile.data} size="lg" />
                  {isOwnProfile && (
                    <label title="Change profile picture" className="absolute bottom-1 right-0 grid h-8 w-8 cursor-pointer place-items-center rounded-full border-2 border-white bg-leaf text-white">
                      <Camera size={15} />
                      <input
                        className="sr-only"
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) {
                            setUploadError("");
                            photoMutation.mutate(file);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
                {isOwnProfile && (
                  <Link to="/settings/password" className="translate-y-3 rounded-xl bg-mint px-4 py-2.5 text-xs font-bold text-leaf">
                    Change password
                  </Link>
                )}
                {!isOwnProfile && (
                  <button
                    disabled={followMutation.isPending}
                    onClick={() => followMutation.mutate()}
                    className={
                      "inline-flex translate-y-6 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold disabled:opacity-60 " +
                      (following ? "bg-slate-100 text-slate-700" : "bg-leaf text-white hover:bg-emerald-800")
                    }
                  >
                    {following ? <UserRoundCheck size={15} /> : <UserRoundPlus size={15} />}
                    {followMutation.isPending ? "Updating…" : following ? "Following" : "Follow"}
                  </button>
                )}
              </div>
              <div className="mt-3">
                <h1 className="font-display text-2xl font-extrabold">{profile.data.name || profile.data.username || "Profile"}</h1>
                <p className="mt-1 text-sm text-muted">{profile.data.username ? `@${profile.data.username}` : "Route community member"}</p>
              </div>
              {isOwnProfile && photoMutation.isPending && (
                <p role="status" className="mt-3 text-xs text-muted">
                  Uploading profile picture…
                </p>
              )}
              {(photoMutation.error || uploadError) && (
                <p role="alert" className="mt-3 text-xs text-rose-600">
                  {photoMutation.error ? getApiError(photoMutation.error) : uploadError}
                </p>
              )}
              {followMutation.error && (
                <p role="alert" className="mt-3 text-xs text-rose-600">
                  {getApiError(followMutation.error)}
                </p>
              )}
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {profile.data.email && <Info label="Email" value={profile.data.email} />}
                {typeof profile.data.dateOfBirth === "string" && <Info label="Date of birth" value={new Date(profile.data.dateOfBirth).toLocaleDateString()} />}
                {typeof profile.data.gender === "string" && <Info label="Gender" value={profile.data.gender} />}
                {(typeof profile.data.createdAt === "string" || typeof profile.data.created_at === "string") && (
                  <Info label="Member since" value={new Date(String(profile.data.createdAt || profile.data.created_at)).toLocaleDateString(undefined, { month: "long", year: "numeric" })} />
                )}
                {typeof profile.data.followersCount === "number" && <Info label="Followers" value={String(profile.data.followersCount)} />}
                {typeof profile.data.followingCount === "number" && <Info label="Following" value={String(profile.data.followingCount)} />}
              </div>
            </>
          )}
        </div>
      </section>
      <h2 className="px-1 font-display text-xl font-extrabold">Posts</h2>
      {posts.isPending && (
        <div className="rounded-3xl bg-white">
          <Spinner label="Loading posts" />
        </div>
      )}
      {posts.isError && (
        <p role="alert" className="rounded-2xl bg-rose-50 p-5 text-sm text-rose-700">
          {getApiError(posts.error)}
        </p>
      )}
      {posts.isSuccess &&
        (posts.data.length ? (
          <div className="space-y-5">
            {posts.data.map((post) => (
              <PostCard key={post._id || post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl bg-white p-8 text-center text-sm text-muted">No posts yet.</div>
        ))}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
      <UserRound size={16} className="text-leaf" />
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{label}</p>
        <p className="mt-0.5 text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}
