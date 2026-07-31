import type { DictionaryEntry, DictionaryMeaning, Suggestion } from "./types";

const DICT_API = "https://api.dictionaryapi.dev/api/v2/entries/en";
const DATAMUSE = "https://api.datamuse.com/words";

type RawDefinition = {
  definition?: string;
  example?: string;
  synonyms?: string[];
  antonyms?: string[];
};
type RawMeaning = {
  partOfSpeech?: string;
  definitions?: RawDefinition[];
  synonyms?: string[];
  antonyms?: string[];
};
type RawEntry = {
  word?: string;
  phonetic?: string;
  phonetics?: Array<{ text?: string; audio?: string }>;
  origin?: string;
  meanings?: RawMeaning[];
  sourceUrls?: string[];
};

function unique(values: Array<string | undefined>, limit = 12): string[] {
  const seen = new Set<string>();
  for (const value of values) {
    const v = value?.trim();
    if (v) seen.add(v);
    if (seen.size >= limit) break;
  }
  return [...seen];
}

async function datamuse(params: string): Promise<Array<{ word: string; score?: number }>> {
  try {
    const res = await fetch(`${DATAMUSE}?${params}`);
    if (!res.ok) return [];
    return (await res.json()) as Array<{ word: string; score?: number }>;
  } catch {
    return [];
  }
}

export async function fetchSuggestions(query: string): Promise<Suggestion[]> {
  const rows = await datamuse(`sp=${encodeURIComponent(query.trim())}*&max=8`);
  const fallback = rows.length ? rows : await datamuse(`sl=${encodeURIComponent(query)}&max=8`);
  return fallback.map((r) => ({ word: r.word, score: r.score ?? 0 }));
}

export async function fetchThemeWords(theme: string, max: number): Promise<string[]> {
  const rows = await datamuse(`ml=${encodeURIComponent(theme)}&max=${max}&md=f`);
  return rows.map((r) => r.word).filter((w) => /^[a-z][a-z-]{2,}$/i.test(w));
}

export async function fetchDictionaryEntry(term: string): Promise<DictionaryEntry | null> {
  const word = term.trim().toLowerCase();
  if (!word) return null;

  let raw: RawEntry[] = [];
  try {
    const res = await fetch(`${DICT_API}/${encodeURIComponent(word)}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Dictionary request failed (${res.status})`);
    const json = await res.json();
    if (!Array.isArray(json)) return null;
    raw = json as RawEntry[];
  } catch (error) {
    throw new Error(
      error instanceof Error && error.message.startsWith("Dictionary")
        ? error.message
        : "Could not reach the dictionary service.",
    );
  }
  if (!raw.length) return null;

  const meanings: DictionaryMeaning[] = raw.flatMap((entry) =>
    (entry.meanings ?? []).map((meaning) => ({
      partOfSpeech: meaning.partOfSpeech ?? "",
      definitions: (meaning.definitions ?? [])
        .filter((d) => d.definition)
        .map((d) => ({
          definition: d.definition as string,
          example: d.example,
          synonyms: d.synonyms ?? [],
          antonyms: d.antonyms ?? [],
        })),
      synonyms: meaning.synonyms ?? [],
      antonyms: meaning.antonyms ?? [],
    })),
  );

  const apiSynonyms = meanings.flatMap((m) => [
    ...m.synonyms,
    ...m.definitions.flatMap((d) => d.synonyms),
  ]);
  const apiAntonyms = meanings.flatMap((m) => [
    ...m.antonyms,
    ...m.definitions.flatMap((d) => d.antonyms),
  ]);

  const [extraSyn, extraAnt, related] = await Promise.all([
    apiSynonyms.length >= 6 ? [] : datamuse(`rel_syn=${encodeURIComponent(word)}&max=10`),
    apiAntonyms.length >= 4 ? [] : datamuse(`rel_ant=${encodeURIComponent(word)}&max=8`),
    datamuse(`ml=${encodeURIComponent(word)}&max=10`),
  ]);

  return {
    word: raw[0].word ?? word,
    phonetic: raw.find((e) => e.phonetic)?.phonetic,
    phonetics: unique(
      raw.flatMap((e) => (e.phonetics ?? []).map((p) => JSON.stringify(p))),
      6,
    )
      .map((s) => JSON.parse(s) as { text?: string; audio?: string })
      .filter((p) => p.text || p.audio),
    meanings: meanings.filter((m) => m.definitions.length),
    origin: raw.find((e) => e.origin)?.origin,
    synonyms: unique([...apiSynonyms, ...extraSyn.map((r) => r.word)]),
    antonyms: unique([...apiAntonyms, ...extraAnt.map((r) => r.word)], 8),
    related: unique(
      related.map((r) => r.word).filter((w) => w.toLowerCase() !== word),
      10,
    ),
    sourceUrls: unique(raw.flatMap((e) => e.sourceUrls ?? []), 3),
  };
}
