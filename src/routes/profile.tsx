import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookMarked, Flame, Heart, LogOut, Settings, ChevronRight } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/AppShell";
import { LocalOnlyNotice } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { useAuth, useData } from "@/lib/services";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — WordSnap AI" },
      { name: "description", content: "Your WordSnap AI learning profile and progress." },
      { property: "og:title", content: "Profile — WordSnap AI" },
      { property: "og:description", content: "Track your streak, saved words and progress." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { user, auth } = useAuth();
  const data = useData();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const stats = useQuery({ queryKey: ["stats"], queryFn: () => data.getStats() });

  return (
    <AppShell>
      <ScreenHeader
        title="Profile"
        right={
          <Link to="/settings" aria-label="Settings" className="glass grid h-11 w-11 place-items-center rounded-2xl">
            <Settings className="h-5 w-5" />
          </Link>
        }
      />

      <div className="px-5">
        {user ? (
          <div className="card-premium relative overflow-hidden rounded-3xl p-6 text-center">
            <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full gradient-primary opacity-30 blur-3xl" />
            <div className="mx-auto grid h-24 w-24 place-items-center rounded-full gradient-primary text-3xl font-black shadow-[var(--shadow-glow)]">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="mt-4 text-xl font-black">{user.name}</h2>
            <p className="text-sm text-ink/50">{user.email}</p>
          </div>
        ) : (
          <div className="card-premium rounded-3xl p-6 text-center">
            <h2 className="text-lg font-bold">You're browsing as a guest</h2>
            <p className="mt-2 text-sm text-ink/60">
              Sign in to keep your vocabulary, history and streak in sync across devices.
            </p>
            <div className="mt-5 flex gap-2">
              <Button asChild className="h-11 flex-1 rounded-2xl gradient-primary text-sm font-semibold">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild variant="outline" className="h-11 flex-1 rounded-2xl border-ink/15 bg-ink/5 text-sm">
                <Link to="/register">Create account</Link>
              </Button>
            </div>
          </div>
        )}

        {data.isLocalOnly && <LocalOnlyNotice label="Your progress" />}

        <div className="mt-4 grid grid-cols-3 gap-3">
          <Stat icon={<BookMarked className="h-4 w-4" />} label="Saved" value={stats.data?.wordsSaved ?? 0} />
          <Stat icon={<Heart className="h-4 w-4 text-accent" />} label="Favourites" value={stats.data?.favourites ?? 0} />
          <Stat icon={<Flame className="h-4 w-4 text-orange-400" />} label="Streak" value={stats.data?.streak ?? 0} />
        </div>

        <div className="mt-6 space-y-2">
          <MenuItem to="/vocabulary" label="My vocabulary" />
          <MenuItem to="/flashcards" label="Flashcard revision" />
          <MenuItem to="/history" label="Search history" />
          <MenuItem to="/settings" label="Settings & accessibility" />
        </div>

        {user && (
          <button
            onClick={async () => {
              await queryClient.cancelQueries();
              queryClient.clear();
              await auth.signOut();
              navigate({ to: "/login", replace: true });
            }}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 py-3.5 text-sm font-semibold text-red-300 hover:bg-red-500/20"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        )}

      </div>
    </AppShell>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="card-premium rounded-2xl p-3 text-center">
      <div className="flex justify-center">{icon}</div>
      <div className="mt-1 text-xl font-black">{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-ink/50">{label}</div>
    </div>
  );
}

function MenuItem({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="glass flex items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-medium hover:bg-ink/10"
    >
      {label}
      <ChevronRight className="h-4 w-4 text-ink/40" />
    </Link>
  );
}
