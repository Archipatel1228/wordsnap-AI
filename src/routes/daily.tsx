import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, ScreenHeader } from "@/components/AppShell";
import { MOCK_WORDS } from "@/lib/mock-data";
import { Calendar, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/daily")({
  head: () => ({
    meta: [
      { title: "Daily Word — WordSnap AI" },
      { name: "description", content: "Learn a new word every day." },
    ],
  }),
  component: Daily,
});

function Daily() {
  const today = MOCK_WORDS[0];
  const upcoming = MOCK_WORDS.slice(1, 5);
  const dateStr = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <AppShell>
      <ScreenHeader title="Daily Word" subtitle={dateStr} />

      <div className="px-5">
        <Link
          to="/word/$id"
          params={{ id: today.id }}
          className="block relative overflow-hidden rounded-[2rem] p-6 shadow-[var(--shadow-glow)]"
          style={{ backgroundImage: "var(--gradient-primary)" }}
        >
          <div className="absolute -right-10 -bottom-10 h-52 w-52 rounded-full bg-white/20 blur-3xl" />
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/80">
            <Calendar className="h-3.5 w-3.5" /> Today's word
          </div>
          <h2 className="mt-3 text-5xl font-black leading-tight">{today.word}</h2>
          <p className="mt-1 text-sm text-white/80">
            {today.phonetic} · {today.partOfSpeech}
          </p>
          <p className="mt-4 text-base leading-relaxed text-white/95">{today.meaning}</p>
          <p className="mt-4 rounded-2xl bg-white/15 px-4 py-3 text-sm italic backdrop-blur">
            "{today.examples[0]}"
          </p>
          <div className="mt-5 flex items-center gap-1 text-sm font-semibold">
            Explore full details <ArrowRight className="h-4 w-4" />
          </div>
        </Link>

        <h3 className="mt-8 mb-3 text-sm font-bold uppercase tracking-widest text-white/50">
          Coming up this week
        </h3>
        <div className="space-y-2">
          {upcoming.map((w, i) => (
            <Link
              key={w.id}
              to="/word/$id"
              params={{ id: w.id }}
              className="glass flex items-center gap-4 rounded-2xl p-4"
            >
              <div className="grid h-12 w-12 place-items-center rounded-2xl gradient-primary text-sm font-black">
                +{i + 1}d
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold">{w.word}</div>
                <div className="truncate text-xs text-white/50">{w.meaning}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
