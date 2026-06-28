import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  BarChart3,
  Map as MapIcon,
  GitCompare,
  Sparkles,
  Database,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: BarChart3 },
  { to: "/explore", label: "Districts", icon: Database },
  { to: "/compare", label: "Compare", icon: GitCompare },
  { to: "/predict", label: "AI Predictions", icon: Sparkles },
];

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const user = userStr ? JSON.parse(userStr) : null;

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate({ to: "/login" });
  };

  const currentNav = [...nav];
  if (user?.role === "admin") {
    currentNav.push({ to: "/admin", label: "Admin Panel", icon: ShieldCheck });
  }

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-64 hidden md:flex flex-col border-r border-sidebar-border bg-sidebar">
        <div className="px-6 py-6 border-b border-sidebar-border">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Republic of Rwanda
          </p>
          <h1 className="text-lg leading-tight mt-1">
            Statistics Explorer
          </h1>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {currentNav.map((n) => {
            const active = location.pathname === n.to;
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent",
                )}
              >
                <Icon className="w-4 h-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-sidebar-border space-y-2">
          {user && (
            <div className="px-2 py-1">
              <p className="text-[10px] text-muted-foreground">Logged in as</p>
              <p className="text-sm font-medium text-sidebar-foreground truncate" title={user.names}>
                {user.names}
              </p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{user.role}</p>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-red-400 hover:text-red-300 hover:bg-sidebar-accent transition-colors text-left"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
          <div className="text-[10px] text-muted-foreground pt-1 border-t border-sidebar-border/50">
            Sample dataset · 30 districts
          </div>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <header className="md:hidden border-b border-border px-4 py-3 bg-card space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-base font-semibold">Rwanda Stats</h1>
            <div className="flex items-center gap-2">
              {user && (
                <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                  {user.names.split(" ")[0]}
                </span>
              )}
              <button
                onClick={handleSignOut}
                className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1 hover:bg-red-500/20"
              >
                <LogOut className="w-3 h-3" />
                Sign Out
              </button>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto py-1 border-t border-border/50">
            {currentNav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="text-xs px-2 py-1 rounded hover:bg-accent whitespace-nowrap"
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </header>
        <div className="p-6 md:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
