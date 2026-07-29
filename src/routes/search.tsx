import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Search as SearchIcon } from "lucide-react";
import { MOCK_WORDS, findWord } from "@/lib/mock-data";
import { z } from "zod";

const searchSchema = z.object({ q: z.string().optional() });

export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Search results — WordSnap AI" },
      { name: "description", content: "AI-powered word and phrase explanations." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q = "" } = Route.useSearch();
  const primary = findWord(q) ?? MOCK_WORDS[0];
  const others = MOCK_WORDS.filter((w) => w.id !== primary.id).slice(0, 4);

  return (
    <div className="mx-auto min-h-screen w-full max-w-[520px] px-5 pb-16 pt-8">
      <div className="flex items-center gap-3">
        <Link
          to="/home"
          className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/5"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            defaultValue={q}
            className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 pl-11 pr-4 text-sm outline-none placeholder:text-white/40"
            placeholder="Search"
          />
        </div>
      </div>

      <Link
        to="/word/$id"
        params={{ id: primary.id }}
        className="mt-6 block card-premium animate-float-in rounded-3xl p-6"
      >
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-widest text-white/50">Best match</p>
            <h2 className="mt-2 text-4xl font-black gradient-text">{primary.word}</h2>
            <p className="mt-1 text-sm text-white/50">
              {primary.phonetic} · {primary.partOfSpeech}
            </p>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider">
            {primary.level}
          </span>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-white/85">{primary.meaning}</p>
        <p className="mt-3 rounded-2xl bg-white/5 px-4 py-3 text-sm italic text-white/70">
          "{primary.examples[0]}"
        </p>
      </Link>

      <h3 className="mt-8 mb-3 text-sm font-bold uppercase tracking-widest text-white/50">
        Related
      </h3>
      <div className="space-y-3">
        {others.map((w) => (
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
