import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, ScreenHeader } from "@/components/AppShell";
import { USER_STATS, ACHIEVEMENTS } from "@/lib/mock-data";
import { Settings, Flame, BookMarked, Trophy, LogOut, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — WordSnap AI" },
      { name: "description", content: "Your learning profile and achievements." },
    ],
  }),
  component: Profile,
});

function Profile() {
  return (
    <AppShell>
      <ScreenHeader
        title="Profile"
        right={
          <Link
            to="/settings"
            className="glass grid h-11 w-11 place-items-center rounded-2xl"
          >
            <Settings className="h-5 w-5" />
          </Link>
        }
      />

      <div className="px-5">
        <div className="card-premium relative overflow-hidden rounded-3xl p-6 text-center">
          <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full gradient-primary opacity-30 blur-3xl" />
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-full gradient-primary text-3xl font-black shadow-[var(--shadow-glow)]">
            {USER_STATS.name.charAt(0)}
          </div>
          <h2 className="mt-4 text-xl font-black">{USER_STATS.name}</h2>
          <p className="text-sm text-white/50">{USER_STATS.email}</p>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs">
            <span className="gradient-text font-bold">Level {USER_STATS.level}</span>
            <span className="text-white/40">•</span>
            <span>{USER_STATS.xp} XP</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full gradient-primary"
              style={{ width: `${(USER_STATS.xp / USER_STATS.xpToNext) * 100}%` }}
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <Stat icon={<BookMarked className="h-4 w-4" />} label="Learned" value={USER_STATS.wordsLearned} />
          <Stat icon={<Trophy className="h-4 w-4 text-amber-400" />} label="Saved" value={USER_STATS.wordsSaved} />
          <Stat icon={<Flame className="h-4 w-4 text-orange-400" />} label="Streak" value={USER_STATS.streak} />
        </div>

        <h3 className="mt-7 mb-3 text-sm font-bold uppercase tracking-widest text-white/50">
          Achievements
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {ACHIEVEMENTS.map((a) => (
            <div
              key={a.id}
              className={`aspect-square rounded-2xl p-3 text-center transition-all ${
                a.unlocked
                  ? "card-premium"
                  : "border border-dashed border-white/10 opacity-40"
              }`}
            >
              <div className="text-3xl">{a.icon}</div>
              <div className="mt-2 text-[11px] font-semibold leading-tight">{a.name}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-2">
          <MenuItem to="/settings" label="Settings & Preferences" />
          <MenuItem to="/vocabulary" label="My Vocabulary" />
          <MenuItem to="/history" label="Search History" />
        </div>

        <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 py-3.5 text-sm font-semibold text-red-400 hover:bg-red-500/20">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </AppShell>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="card-premium rounded-2xl p-3 text-center">
      <div className="flex justify-center">{icon}</div>
      <div className="mt-1 text-xl font-black">{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-white/50">{label}</div>
    </div>
  );
}

function MenuItem({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="glass flex items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-medium hover:bg-white/10"
    >
      {label}
      <ChevronRight className="h-4 w-4 text-white/40" />
    </Link>
  );
}
