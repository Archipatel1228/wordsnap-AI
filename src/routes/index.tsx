import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WordSnap AI — Understand Anything Instantly" },
      {
        name: "description",
        content:
          "WordSnap AI is a real dictionary with AI explanations: pronunciation, definitions, examples, synonyms and translations for any English word.",
      },
      { property: "og:title", content: "WordSnap AI — Understand Anything Instantly" },
      {
        property: "og:description",
        content: "A real dictionary plus AI explanations, in a fast installable app.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Splash,
});

function Splash() {
  const navigate = useNavigate();
  useEffect(() => {
    const timer = setTimeout(() => navigate({ to: "/home" }), 1500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="relative animate-float-in">
        <div className="absolute inset-0 -z-10 rounded-full gradient-primary opacity-50 blur-3xl" />
        <Logo size={112} />
      </div>
      <h1 className="mt-8 text-4xl font-black tracking-tight">
        Word<span className="gradient-text">Snap</span> AI
      </h1>
      <p className="mt-3 max-w-xs text-sm text-ink/60">Understand anything instantly.</p>
      <Link
        to="/home"
        className="mt-10 text-xs uppercase tracking-[0.3em] text-ink/40 hover:text-ink/70"
      >
        Enter →
      </Link>
    </main>
  );
}
