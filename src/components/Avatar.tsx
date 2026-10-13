import type { User } from "../types";

export function Avatar({ user, size = "md" }: { user?: User | null; size?: "sm" | "md" | "lg" }) {
  const name = user?.name || user?.username || "Route member";
  const photo = user?.photo || user?.profilePhoto;
  const dimensions = size === "lg" ? "h-14 w-14 text-lg" : size === "sm" ? "h-9 w-9 text-xs" : "h-11 w-11 text-sm";
  return photo ? (
    <img src={photo} alt={name} className={dimensions + " rounded-full object-cover ring-2 ring-white"} />
  ) : (
    <div aria-label={name} className={dimensions + " grid place-items-center rounded-full bg-emerald-100 font-bold text-emerald-800 ring-2 ring-white"}>
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}
