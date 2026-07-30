import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Search as SearchIcon, RefreshCw, AlertTriangle, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { MOCK_WORDS } from "@/lib/mock-data";
import { explainTerm, type Explanation } from "@/lib/ai.functions";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { Button } from "@/components/ui/button";

const searchSchema = z.object({ q: z.string().optional() });

export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Search results — WordSnap AI" },
      { name: "description", content: "AI-powered word, phrase and sentence explanations." },
      { property: "og:title", content: "Search results — WordSnap AI" },
      {
        property: "og:description",
        content: "Instant AI meaning, pronunciation, translation, synonyms and examples.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q = "" } = Route.useSearch();
  const nav = useNavigate();
  const [term, setTerm] = useState(q);
  const online = useOnlineStatus();
  const explain = useServerFn(explainTerm);

  useEffect(() => setTerm(q), [q]);

  const query = useQuery<Explanation>({
    queryKey: ["explain", q],
    queryFn: () => explain({ data: { query: q } }),
    enabled: q.trim().length > 0,
    retry: 1,
    staleTime: 1000 * 60 * 60,
  });

  const speak = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
    }
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-[520px] px-5 pb-32 pt-8">
      <div className="flex items-center gap-3">
        <Link
          to="/home"
          className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/5"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (term.trim()) nav({ to: "/search", search: { q: term.trim() } });
          }}
          className="relative flex-1"
        >
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 pl-11 pr-4 text-sm outline-none placeholder:text-white/40"
            placeholder="Search a word, phrase or sentence"
          />
        </form>
      </div>

      {q.trim().length === 0 && (
        <p className="mt-10 text-center text-sm text-white/50">
          Type anything above and we'll explain it instantly.
        </p>
      )}

      {query.isPending && q.trim().length > 0 && <ResultSkeleton />}

      {query.isError && (
        <div className="card-premium mt-6 rounded-3xl p-6 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-rose-500/15">
            <AlertTriangle className="h-6 w-6 text-rose-300" />
          </div>
          <h2 className="mt-4 text-base font-bold">Couldn't explain that</h2>
          <p className="mt-2 text-sm text-white/60">
            {!online
              ? "You're offline. Reconnect and try again."
              : ((query.error as Error)?.message ?? "Something went wrong.")}
          </p>
          <Button
            onClick={() => query.refetch()}
            className="mt-5 h-12 w-full rounded-2xl gradient-primary text-sm font-semibold"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Try again
          </Button>
        </div>
      )}

      {query.data && (
        <>
          <div className="card-premium mt-6 animate-float-in rounded-3xl p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-widest text-white/50">AI result</p>
                <h1 className="mt-2 break-words text-3xl font-black gradient-text">
                  {query.data.word}
                </h1>
                <p className="mt-1 text-sm text-white/50">
                  {query.data.phonetic} · {query.data.partOfSpeech}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  aria-label="Play pronunciation"
                  onClick={() => speak(query.data.word)}
                  className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
                <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider">
                  {query.data.level}
                </span>
              </div>
            </div>

            <Section title="Meaning">{query.data.meaning}</Section>
            <Section title="AI explanation">{query.data.aiExplanation}</Section>
            <Section title="Translation">{query.data.translation}</Section>

            <h3 className="mt-5 text-xs font-bold uppercase tracking-widest text-white/50">
              Examples
            </h3>
            <div className="mt-2 space-y-2">
              {query.data.examples.map((ex) => (
                <p key={ex} className="rounded-2xl bg-white/5 px-4 py-3 text-sm italic text-white/75">
                  "{ex}"
                </p>
              ))}
            </div>

            <Chips label="Synonyms" items={query.data.synonyms} />
            <Chips label="Antonyms" items={query.data.antonyms} />
            <Chips label="Related" items={query.data.related} />
          </div>
        </>
      )}

      <h3 className="mt-8 mb-3 text-sm font-bold uppercase tracking-widest text-white/50">
        Explore more
      </h3>
      <div className="space-y-3">
        {MOCK_WORDS.slice(0, 4).map((w) => (
          <Link
            key={w.id}
            to="/word/$id"
            params={{ id: w.id }}
            className="glass flex items-center justify-between rounded-2xl p-4 hover:bg-white/10"
          >
            <div className="min-w-0">
              <div className="font-bold">{w.word}</div>
              <div className="truncate text-xs text-white/50">{w.meaning}</div>
            </div>
            <span className="shrink-0 rounded-full bg-white/10 px-2 py-1 text-[10px] uppercase tracking-wider">
              {w.partOfSpeech}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <h3 className="text-xs font-bold uppercase tracking-widest text-white/50">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-white/85">{children}</p>
    </div>
  );
}

function Chips({ label, items }: { label: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="mt-5">
      <h3 className="text-xs font-bold uppercase tracking-widest text-white/50">{label}</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((i) => (
          <span key={i} className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/80">
            {i}
          </span>
        ))}
      </div>
    </div>
  );
}

function ResultSkeleton() {
  return (
    <div className="card-premium mt-6 space-y-4 rounded-3xl p-6">
      <div className="h-3 w-24 animate-pulse rounded-full bg-white/10" />
      <div className="h-9 w-48 animate-pulse rounded-2xl bg-white/10" />
      <div className="h-3 w-32 animate-pulse rounded-full bg-white/10" />
      <div className="space-y-2 pt-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-3 w-full animate-pulse rounded-full bg-white/10" />
        ))}
      </div>
      <div className="h-16 animate-pulse rounded-2xl bg-white/5" />
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-7 w-20 animate-pulse rounded-full bg-white/10" />
        ))}
      </div>
    </div>
  );
}
