import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Clock, Flame } from "lucide-react";
import { listTrendingWords } from "@/lib/dictionary.functions";
import { useData } from "@/lib/services";

/** Recent searches (device) + live trending words (Datamuse). */
export function RecentAndTrending({ onPick }: { onPick: (word: string) => void }) {
  const data = useData();
  const trendingFn = useServerFn(listTrendingWords);

  const history = useQuery({ queryKey: ["history"], queryFn: () => data.listHistory() });
  const trending = useQuery({
    queryKey: ["trending"],
    queryFn: () => trendingFn(),
    staleTime: 1000 * 60 * 60,
  });

  const recent = (history.data ?? []).slice(0, 8);

  return (
    <div className="mt-7 space-y-7">
      {recent.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/50">
            <Clock className="h-3.5 w-3.5" /> Recent searches
          </h2>
          <div className="flex flex-wrap gap-2">
            {recent.map((item) => (
              <button
                key={item.word}
                onClick={() => onPick(item.word)}
                className="rounded-full bg-white/8 px-4 py-2 text-sm text-white/85 hover:bg-white/15"
              >
                {item.word}
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/50">
          <Flame className="h-3.5 w-3.5 text-orange-400" /> Trending words
        </h2>
        {trending.isPending ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-9 w-24 animate-pulse rounded-full bg-white/10" />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(trending.data ?? []).map((word) => (
              <button
                key={word}
                onClick={() => onPick(word)}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/85 hover:bg-white/12"
              >
                {word}
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
