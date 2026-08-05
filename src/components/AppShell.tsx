import { Link, useRouterState } from "@tanstack/react-router";
import { Home, BookMarked, Clock, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/vocabulary", label: "Saved", icon: BookMarked },
  { to: "/daily", label: "Daily", icon: Sparkles },
  { to: "/history", label: "History", icon: Clock },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col">
      <main className="flex-1 pb-28">{children}</main>
      <BottomNav />
    </div>
  );
}

function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4">
      <div className="glass flex w-full max-w-[500px] items-center justify-between rounded-3xl px-2 py-2 shadow-2xl">
        {TABS.map(({ to, label, icon: Icon }) => {
          const active = path === to || (to !== "/home" && path.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition-all",
                active ? "text-white" : "text-ink/50 hover:text-ink/80",
              )}
            >
              {active && (
                <span className="absolute inset-0 -z-10 rounded-2xl gradient-primary opacity-90 shadow-[0_8px_24px_-8px_rgba(124,58,237,0.7)]" />
              )}
              <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 pt-8 pb-4">
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-black tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 truncate text-sm text-ink/60">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </header>
  );
}
