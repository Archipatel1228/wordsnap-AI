import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WordSnap AI — Loading" },
      { name: "description", content: "Launching WordSnap AI." },
    ],
  }),
  component: Splash,
});

function Splash() {
  const navigate = useNavigate();
  useEffect(() => {
    const t = setTimeout(() => navigate({ to: "/onboarding" }), 1800);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="relative animate-float-in">
        <div className="absolute inset-0 -z-10 blur-3xl gradient-primary opacity-60 rounded-full" />
        <div className="grid h-28 w-28 place-items-center rounded-[2rem] gradient-primary shadow-[var(--shadow-glow)] animate-pulse-glow">
          <Sparkles className="h-14 w-14 text-white" strokeWidth={2.4} />
        </div>
      </div>
      <h1 className="mt-8 text-4xl font-black tracking-tight">
        Word<span className="gradient-text">Snap</span> AI
      </h1>
      <p className="mt-3 max-w-xs text-sm text-white/60">
        Instantly understand any word, phrase, or sentence.
      </p>
      <Link
        to="/onboarding"
        className="mt-10 text-xs uppercase tracking-[0.3em] text-white/40 hover:text-white/70"
      >
        Skip →
      </Link>
    </div>
  );
}
