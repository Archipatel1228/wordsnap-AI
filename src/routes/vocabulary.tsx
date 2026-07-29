import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, ScreenHeader } from "@/components/AppShell";
import { SAVED_FOLDERS, MOCK_WORDS } from "@/lib/mock-data";
import { FolderPlus, Layers, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/vocabulary")({
  head: () => ({
    meta: [
      { title: "Vocabulary — WordSnap AI" },
      { name: "description", content: "Your saved words and folders." },
    ],
  }),
  component: Vocab,
});

function Vocab() {
  return (
    <AppShell>
      <ScreenHeader
        title="Vocabulary"
        subtitle="Your saved words & folders"
        right={
          <button className="glass grid h-11 w-11 place-items-center rounded-2xl">
            <FolderPlus className="h-5 w-5" />
          </button>
        }
      />

      <div className="px-5">
        <Button className="h-14 w-full rounded-2xl gradient-primary text-base font-semibold shadow-[var(--shadow-glow)]">
          <Layers className="mr-2 h-5 w-5" /> Start Flashcard Revision
        </Button>

        <h3 className="mt-7 mb-3 text-sm font-bold uppercase tracking-widest text-white/50">
          Folders
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {SAVED_FOLDERS.map((f) => (
            <div
              key={f.id}
              className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${f.color} p-4 shadow-lg`}
            >
              <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/20 blur-2xl" />
              <div className="text-2xl font-black">{f.count}</div>
              <div className="text-xs text-white/80">words</div>
              <div className="mt-4 text-sm font-bold">{f.name}</div>
            </div>
          ))}
        </div>

        <h3 className="mt-7 mb-3 text-sm font-bold uppercase tracking-widest text-white/50">
          Recent saves
        </h3>
        <div className="space-y-2">
          {MOCK_WORDS.slice(0, 5).map((w) => (
            <Link
              key={w.id}
              to="/word/$id"
              params={{ id: w.id }}
              className="glass flex items-center justify-between rounded-2xl p-4 hover:bg-white/10"
            >
              <div className="min-w-0">
                <div className="font-bold">{w.word}</div>
                <div className="truncate text-xs text-white/50">{w.meaning}</div>
              </div>
              <ChevronRight className="h-4 w-4 text-white/40" />
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
