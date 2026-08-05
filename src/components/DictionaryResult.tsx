import { Volume2 } from "lucide-react";
import { toast } from "sonner";
import type { DictionaryEntry } from "@/lib/dictionary/types";
import { primaryAudio, primaryPhonetic } from "@/lib/dictionary/types";
import { pronounce } from "@/lib/speech";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h3 className="text-xs font-bold uppercase tracking-widest text-ink/50">{title}</h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function Chips({ items, tone }: { items: string[]; tone?: "primary" | "accent" }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className={
            tone === "primary"
              ? "rounded-full bg-primary/25 px-3 py-1.5 text-sm"
              : tone === "accent"
                ? "rounded-full bg-accent/25 px-3 py-1.5 text-sm"
                : "rounded-full bg-ink/10 px-3 py-1.5 text-sm text-ink/80"
          }
        >
          {item}
        </span>
      ))}
    </div>
  );
}

/** Renders a live dictionary entry. Missing sections are hidden, never stubbed. */
export function DictionaryResult({ entry }: { entry: DictionaryEntry }) {
  const phonetic = primaryPhonetic(entry);
  const audio = primaryAudio(entry);

  const play = async () => {
    const result = await pronounce(entry.word, audio);
    if (result === "unsupported") toast.info("Audio playback isn't available in this browser.");
  };

  return (
    <article className="card-premium animate-float-in relative overflow-hidden rounded-3xl p-6">
      <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full gradient-primary opacity-25 blur-3xl" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="break-words text-4xl font-black leading-tight gradient-text">
            {entry.word}
          </h1>
          {(phonetic || entry.meanings[0]?.partOfSpeech) && (
            <p className="mt-1 text-sm text-ink/55">
              {[phonetic, entry.meanings[0]?.partOfSpeech].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <button
          onClick={play}
          aria-label={`Play pronunciation of ${entry.word}`}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-ink/10 bg-ink/5 hover:bg-ink/10"
        >
          <Volume2 className="h-5 w-5" />
        </button>
      </div>

      {entry.phonetics.filter((p) => p.text).length > 1 && (
        <Section title="Phonetics">
          <Chips items={[...new Set(entry.phonetics.map((p) => p.text).filter(Boolean) as string[])]} />
        </Section>
      )}

      {entry.meanings.map((meaning, index) => (
        <Section key={`${meaning.partOfSpeech}-${index}`} title={meaning.partOfSpeech || "Meaning"}>
          <ol className="space-y-3">
            {meaning.definitions.slice(0, 6).map((definition, i) => (
              <li key={i} className="rounded-2xl bg-ink/5 px-4 py-3">
                <p className="text-sm leading-relaxed text-ink/90">
                  <span className="mr-2 text-ink/40">{i + 1}.</span>
                  {definition.definition}
                </p>
                {definition.example && (
                  <p className="mt-2 text-sm italic text-ink/60">“{definition.example}”</p>
                )}
              </li>
            ))}
          </ol>
        </Section>
      ))}

      {entry.synonyms.length > 0 && (
        <Section title="Synonyms">
          <Chips items={entry.synonyms} tone="primary" />
        </Section>
      )}
      {entry.antonyms.length > 0 && (
        <Section title="Antonyms">
          <Chips items={entry.antonyms} tone="accent" />
        </Section>
      )}
      {entry.related.length > 0 && (
        <Section title="Related words">
          <Chips items={entry.related} />
        </Section>
      )}
      {entry.origin && (
        <Section title="Origin">
          <p className="text-sm leading-relaxed text-ink/80">{entry.origin}</p>
        </Section>
      )}
      {entry.sourceUrls.length > 0 && (
        <p className="mt-6 text-[11px] text-ink/35">
          Source:{" "}
          <a
            href={entry.sourceUrls[0]}
            target="_blank"
            rel="noreferrer noopener"
            className="underline underline-offset-2"
          >
            {new URL(entry.sourceUrls[0]).hostname}
          </a>
        </p>
      )}
    </article>
  );
}

export function DictionarySkeleton() {
  return (
    <div className="card-premium space-y-4 rounded-3xl p-6" aria-busy="true">
      <div className="h-10 w-48 animate-pulse rounded-2xl bg-ink/10" />
      <div className="h-3 w-32 animate-pulse rounded-full bg-ink/10" />
      <div className="space-y-2 pt-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-3 w-full animate-pulse rounded-full bg-ink/10" />
        ))}
      </div>
      <div className="h-16 animate-pulse rounded-2xl bg-ink/5" />
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-7 w-20 animate-pulse rounded-full bg-ink/10" />
        ))}
      </div>
    </div>
  );
}
