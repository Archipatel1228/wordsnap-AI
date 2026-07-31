import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookMarked, Heart, Layers, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell, ScreenHeader } from "@/components/AppShell";
import { EmptyState, LocalOnlyNotice } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { formatDue } from "@/lib/srs";
import { useData } from "@/lib/services";

type Sort = "recent" | "alpha" | "due";

export const Route = createFileRoute("/vocabulary")({
  head: () => ({
    meta: [
      { title: "My Vocabulary — WordSnap AI" },
      { name: "description", content: "Your saved words, favourites and flashcard revision." },
      { property: "og:title", content: "My Vocabulary — WordSnap AI" },
      { property: "og:description", content: "Save unlimited words and revise with flashcards." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Vocabulary,
});

function Vocabulary() {
  const data = useData();
  const queryClient = useQueryClient();
  const [term, setTerm] = useState("");
  const [sort, setSort] = useState<Sort>("recent");
  const [favouritesOnly, setFavouritesOnly] = useState(false);

  const query = useQuery({ queryKey: ["saved-words"], queryFn: () => data.listSavedWords() });
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["saved-words"] });
    void queryClient.invalidateQueries({ queryKey: ["stats"] });
  };

  const words = useMemo(() => {
    let list = query.data ?? [];
    if (favouritesOnly) list = list.filter((w) => w.favourite);
    if (term.trim()) {
      const t = term.trim().toLowerCase();
      list = list.filter(
        (w) => w.word.toLowerCase().includes(t) || w.definition.toLowerCase().includes(t),
      );
    }
    return [...list].sort((a, b) =>
      sort === "alpha"
        ? a.word.localeCompare(b.word)
        : sort === "due"
          ? a.srs.dueAt - b.srs.dueAt
          : b.createdAt - a.createdAt,
    );
  }, [query.data, term, sort, favouritesOnly]);

  const total = query.data?.length ?? 0;

  return (
    <AppShell>
      <ScreenHeader title="Vocabulary" subtitle={`${total} saved word${total === 1 ? "" : "s"}`} />

      <div className="px-5">
        <Button
          asChild
          className="h-14 w-full rounded-2xl gradient-primary text-base font-semibold shadow-[var(--shadow-glow)]"
        >
          <Link to="/flashcards">
            <Layers className="mr-2 h-5 w-5" /> Start flashcard revision
          </Link>
        </Button>

        {data.isLocalOnly && <LocalOnlyNotice label="Saved vocabulary" />}

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <label htmlFor="vocab-filter" className="sr-only">
            Search saved words
          </label>
          <input
            id="vocab-filter"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search saved words"
            className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 pl-11 pr-4 text-sm outline-none placeholder:text-white/40"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {(["recent", "alpha", "due"] as Sort[]).map((option) => (
            <button
              key={option}
              onClick={() => setSort(option)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                sort === option ? "gradient-primary" : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              {option === "recent" ? "Newest" : option === "alpha" ? "A–Z" : "Due first"}
            </button>
          ))}
          <button
            onClick={() => setFavouritesOnly((v) => !v)}
            aria-pressed={favouritesOnly}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
              favouritesOnly ? "bg-accent" : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            Favourites
          </button>
        </div>

        {query.isPending ? (
          <div className="mt-4 space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : words.length === 0 ? (
          <EmptyState
            icon={<BookMarked className="h-6 w-6" />}
            title={total === 0 ? "No saved words yet" : "Nothing matches that filter"}
            description={
              total === 0
                ? "Search any word and tap Save to build your personal vocabulary."
                : "Try a different search term or clear the filters."
            }
            action={
              total === 0 ? (
                <Button asChild className="h-11 rounded-2xl gradient-primary px-6 text-sm font-semibold">
                  <Link to="/search" search={{ q: "" }}>
                    Search a word
                  </Link>
                </Button>
              ) : undefined
            }
          />
        ) : (
          <ul className="mt-4 space-y-2">
            {words.map((word) => (
              <li key={word.word} className="glass rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <Link to="/word/$id" params={{ id: word.word }} className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-bold">{word.word}</span>
                      {word.partOfSpeech && (
                        <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/60">
                          {word.partOfSpeech}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-white/55">{word.definition}</p>
                    <p className="mt-1 text-[11px] text-white/35">{formatDue(word.srs)}</p>
                  </Link>
                  <div className="flex shrink-0 gap-1">
                    <button
                      aria-label={`${word.favourite ? "Unfavourite" : "Favourite"} ${word.word}`}
                      onClick={async () => {
                        await data.toggleFavourite(word.word);
                        refresh();
                      }}
                      className="grid h-9 w-9 place-items-center rounded-xl bg-white/8"
                    >
                      <Heart
                        className={`h-4 w-4 ${word.favourite ? "text-accent" : "text-white/50"}`}
                        fill={word.favourite ? "currentColor" : "none"}
                      />
                    </button>
                    <button
                      aria-label={`Remove ${word.word}`}
                      onClick={async () => {
                        await data.removeSavedWord(word.word);
                        refresh();
                      }}
                      className="grid h-9 w-9 place-items-center rounded-xl bg-white/8 text-white/50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
