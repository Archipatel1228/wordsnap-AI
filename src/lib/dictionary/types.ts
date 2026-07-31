/** Shapes returned by the dictionary layer. Purely API-driven — no static word data. */

export type PhoneticInfo = {
  text?: string;
  audio?: string;
};

export type DictionaryDefinition = {
  definition: string;
  example?: string;
  synonyms: string[];
  antonyms: string[];
};

export type DictionaryMeaning = {
  partOfSpeech: string;
  definitions: DictionaryDefinition[];
  synonyms: string[];
  antonyms: string[];
};

export type DictionaryEntry = {
  word: string;
  phonetic?: string;
  phonetics: PhoneticInfo[];
  meanings: DictionaryMeaning[];
  origin?: string;
  synonyms: string[];
  antonyms: string[];
  related: string[];
  sourceUrls: string[];
};

export type Suggestion = { word: string; score: number };

/** First definition across all meanings — used for compact list rows. */
export function primaryDefinition(entry: DictionaryEntry): string {
  return entry.meanings[0]?.definitions[0]?.definition ?? "";
}

export function primaryAudio(entry: DictionaryEntry): string | undefined {
  return entry.phonetics.find((p) => p.audio)?.audio;
}

export function primaryPhonetic(entry: DictionaryEntry): string | undefined {
  return entry.phonetic ?? entry.phonetics.find((p) => p.text)?.text;
}
