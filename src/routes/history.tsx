import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, Trash2, X } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/AppShell";
import { EmptyState, LocalOnlyNotice } from "@/components/EmptyState";
import { useData } from "@/lib/services";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History — WordSnap AI" },
      { name: "description", content: "Every word you have looked up in WordSnap AI." },
      { property: "og:title", content: "History — WordSnap AI" },
      { property: "og:description", content: "Revisit the words you searched." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: History,
});

function relative(at: number) {
  const diff = Date.now() - at;
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(at).toLocaleDateString();
}

function History() {
  const data = useData();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["history"], queryFn: () => data.listHistory() });
  const items = query.data ?? [];

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["history"] });

  return (
    <AppShell>
      <ScreenHeader
        title="History"
        subtitle={`${items.length} search${items.length === 1 ? "" : "es"}`}
        right={
          items.length > 0 ? (
            <button
              aria-label="Clear history"
              onClick={async () => {
                await data.clearHistory();
                refresh();
              }}
              className="glass grid h-11 w-11 place-items-center rounded-2xl"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          ) : undefined
        }
      />

      <div className="px-5">
        {data.isLocalOnly && <LocalOnlyNotice label="Search history" />}

        {query.isPending ? (
          <div className="mt-4 space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Clock className="h-6 w-6" />}
            title="No searches yet"
            description="Words you look up will appear here so you can revisit them quickly."
          />
        ) : (
          <ul className="mt-4 space-y-2">
            {items.map((item) => (
              <li key={item.word} className="glass flex items-center gap-2 rounded-2xl pr-2">
                <Link
                  to="/word/$id"
                  params={{ id: item.word }}
                  className="flex min-w-0 flex-1 items-center justify-between px-4 py-3.5"
                >
                  <span className="truncate font-medium">{item.word}</span>
                  <span className="ml-3 shrink-0 text-xs text-white/40">{relative(item.at)}</span>
                </Link>
                <button
                  aria-label={`Remove ${item.word} from history`}
                  onClick={async () => {
                    await data.removeHistory(item.word);
                    refresh();
                  }}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-white/60"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
