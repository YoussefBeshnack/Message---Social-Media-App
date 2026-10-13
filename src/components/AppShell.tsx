import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Home, LogOut, MessageCircle, UserRound, KeyRound } from "lucide-react";
import { useAuth } from "../lib/auth";
import { Avatar } from "./Avatar";
import { useQueryClient } from "@tanstack/react-query";

export function AppShell() {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const links = [
    { to: "/", label: "Home", icon: Home },
    { to: "/profile", label: "Profile", icon: UserRound },
    { to: "/settings/password", label: "Password", icon: KeyRound },
  ];

  function handleSignOut() {
    signOut();
    queryClient.clear();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-30 border-b border-emerald-950/5 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-4 sm:px-8">
          <NavLink to="/" className="flex items-center gap-3" aria-label="Loop home">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-leaf text-white shadow-lg shadow-emerald-900/15">
              <MessageCircle size={20} />
            </span>
            <span className="font-display text-xl font-extrabold tracking-tight">Message</span>
          </NavLink>

          <div className="flex items-center gap-3">
            <span className="hidden text-right sm:block">
              <span className="block text-sm font-bold">{user?.name || user?.username || "Your profile"}</span>
              <span className="block text-xs text-muted">Route community</span>
            </span>
            <NavLink to="/profile" aria-label="Open profile">
              <Avatar user={user} />
            </NavLink>
            <button onClick={handleSignOut} className="focus-ring ml-1 rounded-full p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-ink" aria-label="Sign out" title="Sign out">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1050px] grid-cols-1 gap-7 px-4 py-7 sm:px-8 lg:grid-cols-[220px_minmax(0,650px)]">
        <aside className="hidden lg:block">
          <div className="sticky top-[100px] space-y-8">
            <nav aria-label="Main navigation" className="space-y-2">
              {links.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/"}
                  className={({ isActive }) =>
                    "focus-ring flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition " + (isActive ? "bg-mint text-leaf" : "text-slate-500 hover:bg-white hover:text-ink")
                  }
                >
                  <Icon size={19} strokeWidth={2.2} /> {label}
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>

      <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-slate-200 bg-white/95 px-3 py-2 backdrop-blur lg:hidden">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) => "flex min-w-16 flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[10px] font-bold " + (isActive ? "text-leaf" : "text-slate-400")}
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
