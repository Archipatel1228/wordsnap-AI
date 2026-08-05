import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Check, Copy, Loader2, SpellCheck2, Wand2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { autocorrectText, type AutocorrectResult } from "@/lib/autocorrect.functions";

export const Route = createFileRoute("/autocorrect")({
  head: () => ({
    meta: [
      { title: "AI Autocorrect — WordSnap AI" },
      {
        name: "description",
        content:
          "Paste any text and let WordSnap AI fix spelling, grammar and punctuation with side-by-side explanations.",
      },
      { property: "og:title", content: "AI Autocorrect — WordSnap AI" },
      {
        property: "og:description",
        content: "Fix spelling, grammar and punctuation instantly, with explanations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AutocorrectPage,
});

/** Word-level diff so changed words can be highlighted in the corrected output. */
function diffWords(original: string, corrected: string) {
  const a = original.split(/(\s+)/);
  const b = corrected.split(/(\s+)/);
  const setA = new Set(a.map((t) => t.toLowerCase()));
  const setB = new Set(b.map((t) => t.toLowerCase()));
  return {
    original: a.map((token) => ({ token, changed: token.trim() !== "" && !setB.has(token.toLowerCase()) })),
    corrected: b.map((token) => ({ token, changed: token.trim() !== "" && !setA.has(token.toLowerCase()) })),
  };
}

const TYPE_STYLES: Record<string, string> = {
  spelling: "bg-accent/15 text-accent",
  grammar: "bg-primary/15 text-primary",
  punctuation: "bg-success/15 text-success",
  style: "bg-ink/10 text-ink/70",
};

function AutocorrectPage() {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const run = useServerFn(autocorrectText);

  const mutation = useMutation<AutocorrectResult, Error, string>({
    mutationFn: (value) => run({ data: { text: value } }),
    onError: (error) => toast.error(error.message),
  });

  const result = mutation.data;
  const diff = useMemo(
    () => (result ? diffWords(mutation.variables ?? "", result.correctedText) : null),
    [result, mutation.variables],
  );

  const copy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.correctedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
      toast.success("Corrected text copied");
    } catch {
      toast.error("Copying isn't available in this browser");
    }
  };

  return (
    <AppShell>
      <div className="px-5 pt-8">
        <div className="flex items-center gap-3">
          <Link
            to="/home"
            aria-label="Back to home"
            className="grid h-11 w-11 place-items-center rounded-2xl border border-ink/10 bg-ink/5"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-black">AI Autocorrect</h1>
            <p className="text-xs text-ink/55">Spelling, grammar and punctuation in one pass.</p>
          </div>
        </div>

        <label htmlFor="autocorrect-input" className="sr-only">
          Text to correct
        </label>
        <textarea
          id="autocorrect-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          maxLength={4000}
          placeholder="Paste or type your text here…"
          className="glass mt-5 w-full resize-y rounded-3xl px-4 py-3.5 text-sm outline-none placeholder:text-ink/40 focus:ring-2 focus:ring-primary/50"
        />
        <div className="mt-2 flex items-center justify-between text-[11px] text-ink/45">
          <span>{text.trim() ? `${text.trim().split(/\s+/).length} words` : "Up to 4000 characters"}</span>
          <span>{text.length}/4000</span>
        </div>

        <Button
          onClick={() => mutation.mutate(text.trim())}
          disabled={!text.trim() || mutation.isPending}
          className="gradient-primary mt-3 h-12 w-full rounded-2xl text-sm font-bold text-white"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking…
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" /> Correct my text
            </>
          )}
        </Button>

        {mutation.isPending && (
          <div className="mt-6 space-y-3">
            <div className="h-24 animate-pulse rounded-3xl bg-ink/10" />
            <div className="h-24 animate-pulse rounded-3xl bg-ink/10" />
          </div>
        )}

        {mutation.isError && (
          <div className="card-premium mt-6 rounded-3xl p-4 text-sm">
            <p className="font-semibold text-destructive">{mutation.error.message}</p>
            <Button
              variant="outline"
              onClick={() => mutation.mutate(text.trim())}
              className="mt-3 h-10 rounded-xl border-ink/15 bg-ink/5 text-xs font-semibold"
            >
              Try again
            </Button>
          </div>
        )}

        {result && diff && (
          <div className="mt-6 space-y-4 pb-8">
            <div className="grid gap-3 sm:grid-cols-2">
              <section className="card-premium rounded-3xl p-4">
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-ink/50">
                  Original
                </h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                  {diff.original.map((part, i) => (
                    <span
                      key={i}
                      className={part.changed ? "rounded bg-destructive/15 px-0.5 line-through decoration-destructive/60" : ""}
                    >
                      {part.token}
                    </span>
                  ))}
                </p>
              </section>
              <section className="card-premium rounded-3xl p-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-[11px] font-bold uppercase tracking-widest text-ink/50">
                    Corrected
                  </h2>
                  <Button
                    onClick={copy}
                    variant="outline"
                    className="h-8 rounded-xl border-ink/15 bg-ink/5 px-3 text-[11px] font-semibold"
                  >
                    {copied ? <Check className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                  {diff.corrected.map((part, i) => (
                    <span key={i} className={part.changed ? "rounded bg-success/20 px-0.5 font-semibold" : ""}>
                      {part.token}
                    </span>
                  ))}
                </p>
              </section>
            </div>

            <p className="text-sm text-ink/70">{result.summary}</p>

            <section className="space-y-2">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-ink/50">
                {result.corrections.length} correction{result.corrections.length === 1 ? "" : "s"}
              </h2>
              {result.corrections.length === 0 ? (
                <p className="glass rounded-2xl px-4 py-3 text-sm text-ink/70">
                  Nothing to fix — your text already looks clean.
                </p>
              ) : (
                result.corrections.map((c, i) => (
                  <div key={i} className="glass rounded-2xl px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="line-through opacity-60">{c.original}</span>
                      <span className="text-ink/40">→</span>
                      <span className="font-semibold">{c.corrected}</span>
                      <span
                        className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${TYPE_STYLES[c.type] ?? TYPE_STYLES.style}`}
                      >
                        {c.type}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-ink/60">{c.explanation}</p>
                  </div>
                ))
              )}
            </section>
          </div>
        )}

        {!result && !mutation.isPending && !mutation.isError && (
          <div className="glass mt-6 flex items-start gap-3 rounded-3xl px-4 py-3.5 text-xs text-ink/60">
            <SpellCheck2 className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Paste an email, essay or message. WordSnap AI shows the original and corrected version
              side by side, highlights what changed, and explains each fix.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
