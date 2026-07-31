import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { SearchBar } from "@/components/SearchBar";
import { WordView } from "@/components/WordView";
import { EmptyState } from "@/components/EmptyState";
import { RecentAndTrending } from "@/components/RecentAndTrending";

const searchSchema = z.object({ q: z.string().optional() });

export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Search — WordSnap AI" },
      {
        name: "description",
        content:
          "Search any English word for pronunciation, definitions, examples, synonyms and AI explanations.",
      },
      { property: "og:title", content: "Search — WordSnap AI" },
      {
        property: "og:description",
        content: "Real dictionary results plus AI explanations, instantly.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q = "" } = Route.useSearch();
  const navigate = useNavigate();
  const term = q.trim();

  return (
    <div className="mx-auto min-h-dvh w-full max-w-[520px] px-5 pb-28 pt-8">
      <div className="flex items-center gap-3">
        <Link
          to="/home"
          aria-label="Back to home"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/5"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <SearchBar initialValue={term} className="flex-1" autoFocus={!term} />
      </div>

      <div className="mt-6">
        {term ? (
          <WordView key={term} word={term} />
        ) : (
          <>
            <EmptyState
              title="Search any English word"
              description="Get pronunciation, definitions, examples, synonyms, antonyms and an AI explanation in one place."
            />
            <RecentAndTrending onPick={(word) => navigate({ to: "/search", search: { q: word } })} />
          </>
        )}
      </div>
    </div>
  );
}
