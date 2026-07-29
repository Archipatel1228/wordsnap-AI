import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, ScreenHeader } from "@/components/AppShell";
import { RECENT_HISTORY, MOCK_WORDS } from "@/lib/mock-data";
import { Trash2, Filter, Clock } from "lucide-react";
import { useState } from "react";

const FILTERS = ["All", "Today", "This week", "Older"] as const;

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History — WordSnap AI" },
      { name: "description", content: "Your recent word searches." },
    ],
  }),
  component: History,
});

function History() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const items = [...RECENT_HISTORY, ...MOCK_WORDS.slice(2).map((w, i) => ({
    id: w.id, word: w.word, time: `${i + 3} days ago`
  }))];

  return (
    <AppShell>
      <ScreenHeader
        title="History"
        subtitle={`${items.length} recent searches`}
        right={
          <button className="glass grid h-11 w-11 place-items-center rounded-2xl">
            <Filter className="h-5 w-5" />
          </button>
        }
      />

      <div className="px-5">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                filter === f
                  ? "gradient-primary text-white shadow-[var(--shadow-glow)]"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          {items.map((r) => (
            <div
              key={r.id + r.time}
              className="glass flex items-center gap-3 rounded-2xl p-3"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10">
                <Clock className="h-4 w-4 text-white/60" />
              </div>
              <Link to="/word/$id" params={{ id: r.id }} className="min-w-0 flex-1">
                <div className="font-semibold">{r.word}</div>
                <div className="text-xs text-white/50">{r.time}</div>
              </Link>
              <button className="grid h-9 w-9 place-items-center rounded-xl text-white/40 hover:bg-white/10 hover:text-white">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
