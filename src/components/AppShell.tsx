import { Link, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  BarChart3,
  Map as MapIcon,
  GitCompare,
  Sparkles,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: BarChart3 },
  { to: "/explore", label: "Districts", icon: Database },
  { to: "/compare", label: "Compare", icon: GitCompare },
  { to: "/map", label: "Map", icon: MapIcon },
  { to: "/predict", label: "AI Predictions", icon: Sparkles },
];

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
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
          {nav.map((n) => {
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
        <div className="p-4 text-xs text-muted-foreground border-t border-sidebar-border">
          Sample dataset · 30 districts · 2018–2024
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <header className="md:hidden border-b border-border px-4 py-3 flex items-center justify-between bg-card">
          <h1 className="text-base">Rwanda Stats</h1>
          <nav className="flex gap-1 overflow-x-auto">
            {nav.map((n) => (
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
