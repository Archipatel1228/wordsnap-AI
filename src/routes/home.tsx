import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BookMarked, Flame, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SearchBar } from "@/components/SearchBar";
import { RecentAndTrending } from "@/components/RecentAndTrending";
import { Wordmark } from "@/components/Logo";
import { getWordOfTheDay } from "@/lib/dictionary.functions";
import { primaryDefinition, primaryPhonetic } from "@/lib/dictionary/types";
import { useAuth, useData } from "@/lib/services";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Home — WordSnap AI" },
      {
        name: "description",
        content: "Search any English word and get instant dictionary meaning plus AI explanations.",
      },
      { property: "og:title", content: "Home — WordSnap AI" },
      { property: "og:description", content: "Understand anything instantly." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const data = useData();
  const { user } = useAuth();
  const wordOfDay = useServerFn(getWordOfTheDay);

  const stats = useQuery({ queryKey: ["stats"], queryFn: () => data.getStats() });
  const daily = useQuery({
    queryKey: ["word-of-the-day"],
    queryFn: () => wordOfDay(),
    staleTime: 1000 * 60 * 60 * 6,
  });

  return (
    <AppShell>
      <div className="px-5 pt-8">
        <div className="flex items-center justify-between gap-3">
          <Wordmark size={36} tagline />
          <div className="glass flex items-center gap-2 rounded-full px-3 py-2">
            <Flame className="h-4 w-4 text-orange-400" />
            <span className="text-sm font-bold">{stats.data?.streak ?? 0}</span>
          </div>
        </div>

        {user && <p className="mt-5 text-sm text-white/55">Welcome back, {user.name}.</p>}

        <SearchBar className="mt-4" />

        <Link
          to="/daily"
          className="card-premium animate-float-in relative mt-6 block overflow-hidden rounded-3xl p-5"
        >
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full gradient-primary opacity-30 blur-3xl" />
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/60">
            <Sparkles className="h-3.5 w-3.5" /> Word of the day
          </div>
          {daily.isPending ? (
            <div className="mt-4 space-y-3">
              <div className="h-8 w-40 animate-pulse rounded-2xl bg-white/10" />
              <div className="h-3 w-full animate-pulse rounded-full bg-white/10" />
            </div>
          ) : daily.data ? (
            <>
              <h2 className="mt-3 text-3xl font-black gradient-text">{daily.data.word}</h2>
              <p className="mt-1 text-sm text-white/50">
                {[primaryPhonetic(daily.data), daily.data.meanings[0]?.partOfSpeech]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <p className="mt-3 line-clamp-2 text-sm text-white/80">
                {primaryDefinition(daily.data)}
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-white/60">Today's word will appear once you're online.</p>
          )}
        </Link>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <StatCard label="Explored" value={stats.data?.wordsLearned ?? 0} />
          <StatCard label="Saved" value={stats.data?.wordsSaved ?? 0} />
          <StatCard label="Due" value={stats.data?.dueToday ?? 0} accent />
        </div>

        <Link
          to="/vocabulary"
          className="glass mt-5 flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-medium hover:bg-white/10"
        >
          <BookMarked className="h-4 w-4" /> My vocabulary
        </Link>

        <RecentAndTrending onPick={(word) => navigate({ to: "/search", search: { q: word } })} />
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
