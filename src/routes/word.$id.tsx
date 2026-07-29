import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Bookmark, Copy, Share2, Volume2, Sparkles } from "lucide-react";
import { findWord } from "@/lib/mock-data";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/word/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.id} — WordSnap AI` },
      { name: "description", content: `Meaning, pronunciation, and examples for ${params.id}.` },
    ],
  }),
  loader: ({ params }) => {
    const w = findWord(params.id);
    if (!w) throw notFound();
    return { word: w };
  },
  component: WordPage,
});

function WordPage() {
  const { word } = Route.useLoaderData();
  const [saved, setSaved] = useState(false);

  const speak = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(word.word);
      speechSynthesis.speak(u);
    }
  };
  const copy = () => {
    navigator.clipboard?.writeText(`${word.word} — ${word.meaning}`);
    toast.success("Copied to clipboard");
  };
  const share = async () => {
    try {
      await navigator.share?.({ title: word.word, text: word.meaning });
    } catch {
      toast.success("Shared");
    }
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-[520px] px-5 pb-24 pt-8">
      <div className="flex items-center justify-between">
        <Link
          to="/home"
          className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/5"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <button
          onClick={() => {
            setSaved(!saved);
            toast.success(saved ? "Removed from saved" : "Saved to vocabulary");
          }}
          className={`grid h-11 w-11 place-items-center rounded-2xl border transition-all ${
            saved
              ? "border-transparent gradient-primary"
              : "border-white/10 bg-white/5"
          }`}
        >
          <Bookmark className="h-5 w-5" fill={saved ? "white" : "none"} />
        </button>
      </div>

      <div className="mt-6 animate-float-in card-premium relative overflow-hidden rounded-3xl p-6">
        <div className="absolute -right-10 -top-10 h-52 w-52 rounded-full gradient-primary opacity-30 blur-3xl" />
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <h1 className="text-5xl font-black gradient-text leading-tight">{word.word}</h1>
            <div className="mt-2 flex items-center gap-3 text-sm text-white/60">
              <span>{word.phonetic}</span>
              <span>·</span>
              <span className="italic">{word.partOfSpeech}</span>
            </div>
          </div>
          <button
            onClick={speak}
            className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10"
          >
            <Volume2 className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-white">
            {word.level}
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs">
            {word.translation}
          </span>
        </div>
      </div>

      <Section title="Meaning" icon={<Sparkles className="h-4 w-4 text-fuchsia-400" />}>
        <p className="text-base leading-relaxed text-white/85">{word.meaning}</p>
      </Section>

      <Section title="Examples">
        <div className="space-y-2">
          {word.examples.map((ex: string, i: number) => (
            <p key={i} className="rounded-2xl bg-white/5 px-4 py-3 text-sm italic text-white/75">
              "{ex}"
            </p>
          ))}
        </div>
      </Section>

      <Section title="Synonyms">
        <ChipRow items={word.synonyms} tone="primary" />
      </Section>

      <Section title="Antonyms">
        <ChipRow items={word.antonyms} tone="accent" />
      </Section>

      <Section title="Related">
        <ChipRow items={word.related} />
      </Section>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <ActionBtn onClick={copy} icon={<Copy className="h-4 w-4" />} label="Copy" />
        <ActionBtn onClick={share} icon={<Share2 className="h-4 w-4" />} label="Share" />
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-bold uppercase tracking-widest text-white/60">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function ChipRow({ items, tone }: { items: string[]; tone?: "primary" | "accent" }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((s) => (
        <span
          key={s}
          className={`rounded-full px-3 py-1.5 text-sm ${
            tone === "primary"
              ? "bg-primary/20 text-white"
              : tone === "accent"
                ? "bg-accent/20 text-white"
                : "bg-white/10 text-white/80"
          }`}
        >
          {s}
        </span>
      ))}
    </div>
  );
}

function ActionBtn({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="glass flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-semibold hover:bg-white/10"
    >
      {icon} {label}
    </button>
  );
}
