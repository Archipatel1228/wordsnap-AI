import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { DictionaryEntry, Suggestion } from "@/lib/dictionary/types";
import {
  fetchDictionaryEntry,
  fetchSuggestions,
  fetchThemeWords,
} from "@/lib/dictionary/dictionary.server";

const WordInput = z.object({ word: z.string().min(1).max(60) });
const QueryInput = z.object({ query: z.string().min(1).max(60) });

/** Real dictionary lookup (dictionaryapi.dev + Datamuse enrichment). */
export const lookupWord = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => WordInput.parse(input))
  .handler(async ({ data }): Promise<DictionaryEntry | null> => fetchDictionaryEntry(data.word));

/** Autocomplete suggestions from Datamuse. */
export const suggestWords = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => QueryInput.parse(input))
  .handler(async ({ data }): Promise<Suggestion[]> => fetchSuggestions(data.query));

/** Popular / trending words, generated live from Datamuse themes. */
export const listTrendingWords = createServerFn({ method: "GET" }).handler(
  async (): Promise<string[]> => fetchThemeWords("vocabulary", 12),
);

/** A word of the day, rotated deterministically per calendar day. */
export const getWordOfTheDay = createServerFn({ method: "GET" }).handler(
  async (): Promise<DictionaryEntry | null> => {
    const themes = ["language", "curiosity", "wisdom", "emotion", "nature", "science", "story"];
    const day = Math.floor(Date.now() / 86_400_000);
    const theme = themes[day % themes.length];
    const candidates = await fetchThemeWords(theme, 40);
    if (!candidates.length) return null;

    for (let i = 0; i < 6; i++) {
      const candidate = candidates[(day * 7 + i * 5) % candidates.length];
      const entry = await fetchDictionaryEntry(candidate);
      if (entry && entry.meanings.length) return entry;
    }
    return null;
  },
);
