import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Search, Flame, TrendingUp, Sparkles, Mic } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { MOCK_WORDS, USER_STATS, RECENT_HISTORY } from "@/lib/mock-data";
import { useState } from "react";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Home — WordSnap AI" },
      { name: "description", content: "Your AI-powered vocabulary dashboard." },
    ],
  }),
  component: Home,
});

function Home() {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const daily = MOCK_WORDS[0];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    nav({ to: "/search", search: { q: q || "serendipity" } });
  };

  return (
    <AppShell>
      <div className="px-5 pt-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/50">Good morning,</p>
            <h1 className="text-2xl font-black">{USER_STATS.name.split(" ")[0]} 👋</h1>
          </div>
          <div className="glass flex items-center gap-2 rounded-full px-3 py-2">
            <Flame className="h-4 w-4 text-orange-400" />
            <span className="text-sm font-bold">{USER_STATS.streak}</span>
          </div>
        </div>

        <form onSubmit={submit} className="relative mt-6">
          <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/50" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Explain any word or sentence…"
            className="h-16 w-full rounded-3xl border border-white/10 bg-white/5 pl-14 pr-14 text-base outline-none placeholder:text-white/40 focus:border-primary/60 focus:bg-white/10"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-2xl gradient-primary"
          >
            <Mic className="h-4 w-4" />
          </button>
        </form>

        {/* Daily word */}
        <Link
          to="/word/$id"
          params={{ id: daily.id }}
          className="mt-6 block animate-float-in card-premium relative overflow-hidden rounded-3xl p-5"
        >
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full gradient-primary opacity-30 blur-3xl" />
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/60">
            <Sparkles className="h-3.5 w-3.5" /> Word of the day
          </div>
          <h2 className="mt-3 text-3xl font-black gradient-text">{daily.word}</h2>
          <p className="mt-1 text-sm text-white/50">{daily.phonetic} • {daily.partOfSpeech}</p>
          <p className="mt-3 text-sm text-white/80 line-clamp-2">{daily.meaning}</p>
        </Link>

        {/* Stats */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          <StatCard label="Learned" value={USER_STATS.wordsLearned} />
          <StatCard label="Saved" value={USER_STATS.wordsSaved} />
          <StatCard label="Level" value={USER_STATS.level} accent />
        </div>

        {/* Progress */}
        <div className="mt-5 card-premium rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-semibold">Weekly progress</span>
            </div>
            <span className="text-xs text-white/50">{USER_STATS.xp}/{USER_STATS.xpToNext} XP</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full gradient-primary"
              style={{ width: `${(USER_STATS.xp / USER_STATS.xpToNext) * 100}%` }}
            />
          </div>
        </div>

        {/* Recent */}
        <section className="mt-7">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-bold">Recent</h3>
            <Link to="/history" className="text-xs text-white/50">
              See all
            </Link>
          </div>
          <div className="space-y-2">
            {RECENT_HISTORY.slice(0, 3).map((r) => (
              <Link
                key={r.id}
                to="/word/$id"
                params={{ id: r.id }}
                className="glass flex items-center justify-between rounded-2xl px-4 py-3 hover:bg-white/10"
              >
                <span className="font-medium">{r.word}</span>
                <span className="text-xs text-white/40">{r.time}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="card-premium rounded-2xl p-4 text-center">
      <div className={`text-2xl font-black ${accent ? "gradient-text" : ""}`}>{value}</div>
      <div className="mt-1 text-[11px] uppercase tracking-widest text-white/50">{label}</div>
    </div>
  );
}
