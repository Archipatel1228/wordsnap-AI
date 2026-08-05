import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Zap, Languages, BookMarked, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const SLIDES = [
  {
    icon: Zap,
    title: "Instant AI Explanations",
    body: "Tap any word and get meaning, pronunciation, and examples in a snap.",
  },
  {
    icon: Languages,
    title: "Translate & Understand",
    body: "See translations, synonyms, and antonyms across languages instantly.",
  },
  {
    icon: BookMarked,
    title: "Build Your Vocabulary",
    body: "Save words into folders, track streaks, and revise with flashcards.",
  },
];

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Welcome — WordSnap AI" },
      { name: "description", content: "Discover what WordSnap AI can do for you." },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const [i, setI] = useState(0);
  const S = SLIDES[i];
  const last = i === SLIDES.length - 1;

  return (
    <div className="flex min-h-screen flex-col px-6 py-10">
      <div className="flex justify-end">
        <Link to="/login" className="text-sm text-ink/50 hover:text-ink/80">
          Skip
        </Link>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div key={i} className="animate-float-in">
          <div className="mx-auto grid h-32 w-32 place-items-center rounded-[2rem] gradient-primary shadow-[var(--shadow-glow)]">
            <S.icon className="h-16 w-16 text-white" strokeWidth={2} />
          </div>
          <h2 className="mt-10 text-3xl font-black tracking-tight">{S.title}</h2>
          <p className="mt-4 max-w-xs text-base text-ink/60">{S.body}</p>
        </div>
      </div>

      <div className="mb-6 flex justify-center gap-2">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            className={`h-2 rounded-full transition-all ${
              idx === i ? "w-8 gradient-primary" : "w-2 bg-ink/20"
            }`}
          />
        ))}
      </div>

      {last ? (
        <Link to="/login">
          <Button className="h-14 w-full rounded-2xl gradient-primary text-base font-semibold shadow-[var(--shadow-glow)]">
            Get Started <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      ) : (
        <Button
          onClick={() => setI(i + 1)}
          className="h-14 w-full rounded-2xl gradient-primary text-base font-semibold shadow-[var(--shadow-glow)]"
        >
          Continue <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
