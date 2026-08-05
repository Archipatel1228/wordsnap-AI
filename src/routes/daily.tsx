import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Calendar, ArrowRight } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { getWordOfTheDay } from "@/lib/dictionary.functions";
import { primaryDefinition, primaryPhonetic } from "@/lib/dictionary/types";

export const Route = createFileRoute("/daily")({
  head: () => ({
    meta: [
      { title: "Daily Word — WordSnap AI" },
      { name: "description", content: "A new real English word to learn every day." },
      { property: "og:title", content: "Daily Word — WordSnap AI" },
      { property: "og:description", content: "Learn a new word every day with WordSnap AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Daily,
});

function Daily() {
  const wordOfDay = useServerFn(getWordOfTheDay);
  const query = useQuery({
    queryKey: ["word-of-the-day"],
    queryFn: () => wordOfDay(),
    staleTime: 1000 * 60 * 60 * 6,
  });

  const dateStr = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <AppShell>
      <ScreenHeader title="Daily Word" subtitle={dateStr} />
      <div className="px-5">
        {query.isPending ? (
          <div className="card-premium h-64 animate-pulse rounded-[2rem]" />
        ) : query.data ? (
          <Link
            to="/word/$id"
            params={{ id: query.data.word }}
            className="relative block overflow-hidden rounded-[2rem] p-6 shadow-[var(--shadow-glow)]"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            <div className="pointer-events-none absolute -bottom-10 -right-10 h-52 w-52 rounded-full bg-ink/20 blur-3xl" />
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-ink/80">
              <Calendar className="h-3.5 w-3.5" /> Today's word
            </div>
            <h2 className="mt-3 text-5xl font-black leading-tight">{query.data.word}</h2>
            <p className="mt-1 text-sm text-ink/80">
              {[primaryPhonetic(query.data), query.data.meanings[0]?.partOfSpeech]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <p className="mt-4 text-base leading-relaxed text-ink/95">
              {primaryDefinition(query.data)}
            </p>
            <div className="mt-5 flex items-center gap-1 text-sm font-semibold">
              Explore full details <ArrowRight className="h-4 w-4" />
            </div>
          </Link>
        ) : (
          <EmptyState
            title="Today's word isn't available"
            description="We couldn't reach the dictionary service. Check your connection and try again."
          />
        )}
      </div>
    </AppShell>
  );
}
