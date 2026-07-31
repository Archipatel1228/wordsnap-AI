import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { WordView } from "@/components/WordView";

export const Route = createFileRoute("/word/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.id} — meaning, pronunciation & examples | WordSnap AI` },
      {
        name: "description",
        content: `Definitions, pronunciation, examples, synonyms and an AI explanation for “${params.id}”.`,
      },
      { property: "og:title", content: `${params.id} — WordSnap AI` },
      {
        property: "og:description",
        content: `Dictionary meaning and AI explanation for “${params.id}”.`,
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WordPage,
});

function WordPage() {
  const { id } = Route.useParams();
  return (
    <div className="mx-auto min-h-dvh w-full max-w-[520px] px-5 pb-28 pt-8">
      <Link
        to="/home"
        aria-label="Back to home"
        className="mb-4 grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/5"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <WordView word={decodeURIComponent(id)} />
    </div>
  );
}
