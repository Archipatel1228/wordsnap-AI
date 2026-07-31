import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, RefreshCw, Sparkles, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { explainWord, getAiStatus, type AiExplanation } from "@/lib/ai.functions";
import { useData } from "@/lib/services";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { Button } from "@/components/ui/button";

const BLOCKS: Array<{ key: keyof AiExplanation; label: string }> = [
  { key: "simple", label: "Simple explanation" },
  { key: "eli10", label: "Explain like I'm 10" },
  { key: "hindi", label: "Hindi translation" },
  { key: "gujarati", label: "Gujarati translation" },
  { key: "memoryTrick", label: "Memory trick" },
];

/** AI layer that complements — never replaces — the dictionary result. */
export function AiExplanationPanel({ word, context }: { word: string; context?: string }) {
  const data = useData();
  const online = useOnlineStatus();
  const explain = useServerFn(explainWord);
  const status = useServerFn(getAiStatus);
  const [cached, setCached] = useState<AiExplanation | null>(null);

  const cacheKey = `ai:${word.toLowerCase()}`;

  useEffect(() => {
    let active = true;
    data.getCachedExplanation<AiExplanation>(cacheKey).then((hit) => {
      if (active && hit) setCached(hit.value);
    });
    return () => {
      active = false;
    };
  }, [cacheKey, data]);

  const aiStatus = useQuery({
    queryKey: ["ai-status"],
    queryFn: () => status(),
    staleTime: Infinity,
  });

  const query = useQuery({
    queryKey: ["ai-explanation", word.toLowerCase()],
    queryFn: async () => {
      const result = await explain({ data: { word, context } });
      await data.setCachedExplanation(cacheKey, result);
      return result;
    },
    enabled: Boolean(word) && online && aiStatus.data?.configured === true && !cached,
    retry: 1,
    staleTime: Infinity,
  });

  const explanation = query.data ?? cached;

  if (aiStatus.data && !aiStatus.data.configured) {
    return (
      <Shell>
        <p className="text-sm text-white/70">
          The AI layer is wired and ready — connect a Gemini or OpenAI key to unlock simple
          explanations, ELI10, Hindi and Gujarati translations, memory tricks, real-life examples
          and usage tips.
        </p>
      </Shell>
    );
  }

  if (!explanation && !online) {
    return (
      <Shell>
        <p className="flex items-center gap-2 text-sm text-white/60">
          <WifiOff className="h-4 w-4" /> No cached AI explanation for this word yet. Reconnect to
          generate one.
        </p>
      </Shell>
    );
  }

  if (query.isPending && !explanation) {
    return (
      <Shell>
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-3 w-full animate-pulse rounded-full bg-white/10" />
          ))}
        </div>
      </Shell>
    );
  }

  if (query.isError && !explanation) {
    return (
      <Shell>
        <p className="flex items-start gap-2 text-sm text-white/70">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
          {(query.error as Error)?.message ?? "The AI explanation couldn't be generated."}
        </p>
        <Button
          onClick={() => query.refetch()}
          className="mt-4 h-11 w-full rounded-2xl gradient-primary text-sm font-semibold"
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Try again
        </Button>
      </Shell>
    );
  }

  if (!explanation) return null;

  return (
    <Shell offline={!online}>
      <div className="space-y-4">
        {BLOCKS.map(({ key, label }) => {
          const value = explanation[key];
          if (typeof value !== "string" || !value.trim()) return null;
          return (
            <div key={key}>
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/45">{label}</h4>
              <p className="mt-1.5 text-sm leading-relaxed text-white/85">{value}</p>
            </div>
          );
        })}

        {explanation.realLifeExamples?.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/45">
              Real-life examples
            </h4>
            <div className="mt-2 space-y-2">
              {explanation.realLifeExamples.map((example) => (
                <p key={example} className="rounded-2xl bg-white/5 px-4 py-3 text-sm italic text-white/75">
                  “{example}”
                </p>
              ))}
            </div>
          </div>
        )}

        {explanation.usageTips?.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/45">Usage tips</h4>
            <ul className="mt-2 space-y-1.5">
              {explanation.usageTips.map((tip) => (
                <li key={tip} className="flex gap-2 text-sm text-white/80">
                  <span className="text-accent">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Shell>
  );
}

function Shell({ children, offline }: { children: React.ReactNode; offline?: boolean }) {
  return (
    <section className="card-premium mt-5 rounded-3xl p-6">
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-xl gradient-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-white/60">AI explanation</h2>
        {offline && <span className="ml-auto text-[10px] uppercase text-white/40">cached</span>}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
