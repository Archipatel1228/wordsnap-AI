import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Layers, Volume2 } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { pronounce } from "@/lib/speech";
import { formatDue, scheduleNext, sortForRevision, type ReviewGrade } from "@/lib/srs";
import { useData } from "@/lib/services";

const GRADES: Array<{ grade: ReviewGrade; label: string; className: string }> = [
  { grade: "again", label: "Again", className: "bg-rose-500/20 text-rose-200" },
  { grade: "hard", label: "Hard", className: "bg-amber-500/20 text-amber-200" },
  { grade: "good", label: "Good", className: "bg-ink/10" },
  { grade: "easy", label: "Easy", className: "bg-emerald-500/20 text-emerald-200" },
];

export const Route = createFileRoute("/flashcards")({
  head: () => ({
    meta: [
      { title: "Flashcard Revision — WordSnap AI" },
      {
        name: "description",
        content: "Spaced-repetition flashcards that recommend exactly what to study next.",
      },
      { property: "og:title", content: "Flashcard Revision — WordSnap AI" },
      { property: "og:description", content: "Revise saved words with spaced repetition." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Flashcards,
});

function Flashcards() {
  const data = useData();
  const queryClient = useQueryClient();
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const query = useQuery({ queryKey: ["saved-words"], queryFn: () => data.listSavedWords() });
  const deck = useMemo(() => sortForRevision(query.data ?? []), [query.data]);
  const card = deck[index];

  const grade = async (value: ReviewGrade) => {
    if (!card) return;
    await data.updateSrs(card.word, scheduleNext(card.srs, value));
    await queryClient.invalidateQueries({ queryKey: ["stats"] });
    setRevealed(false);
    setIndex((i) => i + 1);
  };

  return (
    <div className="mx-auto min-h-dvh w-full max-w-[520px] px-5 pb-16 pt-8">
      <div className="flex items-center gap-3">
        <Link
          to="/vocabulary"
          aria-label="Back to vocabulary"
          className="grid h-11 w-11 place-items-center rounded-2xl border border-ink/10 bg-ink/5"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-black">Revision</h1>
          <p className="text-xs text-ink/50">
            {deck.length ? `${Math.min(index + 1, deck.length)} of ${deck.length}` : "Nothing to review"}
          </p>
        </div>
      </div>

      {query.isPending ? (
        <div className="mt-8 h-64 animate-pulse rounded-3xl bg-ink/5" />
      ) : !deck.length ? (
        <EmptyState
          icon={<Layers className="h-6 w-6" />}
          title="Your deck is empty"
          description="Save a few words first — revision picks the ones you're most likely to forget."
          action={
            <Button asChild className="h-11 rounded-2xl gradient-primary px-6 text-sm font-semibold">
              <Link to="/search" search={{ q: "" }}>
                Find a word
              </Link>
            </Button>
          }
        />
      ) : !card ? (
        <EmptyState
          icon={<Layers className="h-6 w-6" />}
          title="Session complete"
          description="You reviewed every card in this deck. Come back when the next ones are due."
          action={
            <Button
              onClick={() => {
                setIndex(0);
                setRevealed(false);
              }}
              className="h-11 rounded-2xl gradient-primary px-6 text-sm font-semibold"
            >
              Review again
            </Button>
          }
        />
      ) : (
        <>
          <button
            onClick={() => setRevealed((v) => !v)}
            className="card-premium mt-8 flex min-h-64 w-full flex-col items-center justify-center gap-3 rounded-[2rem] p-8 text-center"
          >
            <span className="text-3xl font-black gradient-text">{card.word}</span>
            {card.phonetic && <span className="text-sm text-ink/50">{card.phonetic}</span>}
            {revealed ? (
              <p className="mt-3 text-sm leading-relaxed text-ink/85">{card.definition}</p>
            ) : (
              <span className="mt-3 text-xs uppercase tracking-widest text-ink/40">
                Tap to reveal
              </span>
            )}
            <span className="mt-2 text-[11px] text-ink/35">{formatDue(card.srs)}</span>
          </button>

          <div className="mt-4 flex justify-center">
            <button
              onClick={() => pronounce(card.word, card.audio)}
              className="glass flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm"
            >
              <Volume2 className="h-4 w-4" /> Pronounce
            </button>
          </div>

          <div className="mt-6 grid grid-cols-4 gap-2">
            {GRADES.map(({ grade: value, label, className }) => (
              <button
                key={value}
                onClick={() => grade(value)}
                className={`rounded-2xl py-3 text-xs font-bold ${className}`}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
