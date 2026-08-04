import { createFileRoute } from "@tanstack/react-router";
import { fetchDictionaryEntry } from "@/lib/dictionary/dictionary.server";

/**
 * Public lookup endpoint used by the WordSnap browser extension.
 * Returns the real dictionary entry plus an AI explanation. The AI key never
 * leaves the server — the extension only ever sees the rendered result.
 */

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type",
  "access-control-allow-methods": "GET,POST,OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...cors },
  });

const aiSchema = {
  type: "object",
  properties: {
    simple: { type: "string" },
    advanced: { type: "string" },
    explanation: { type: "string" },
    example: { type: "string" },
    memoryTrick: { type: "string" },
    difficulty: { type: "string", enum: ["Easy", "Medium", "Hard"] },
    cefr: { type: "string", enum: ["A1", "A2", "B1", "B2", "C1", "C2"] },
    ielts: { type: "string" },
    hindi: { type: "string" },
    gujarati: { type: "string" },
  },
  required: [
    "simple",
    "advanced",
    "explanation",
    "example",
    "memoryTrick",
    "difficulty",
    "cefr",
    "ielts",
    "hindi",
    "gujarati",
  ],
  additionalProperties: false,
} as const;

type Level = "beginner" | "intermediate" | "advanced";

async function explain(word: string, context: string, level: Level) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) return null;
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
    body: JSON.stringify({
      model: "google/gemini-3.6-flash",
      messages: [
        {
          role: "system",
          content: `You explain English words to a ${level} learner. "simple" = one plain sentence meaning. "advanced" = a precise, nuanced definition. "explanation" = a vivid everyday analogy, 1-2 sentences, beginner-friendly. "example" = one natural sentence using the word. "memoryTrick" = one mnemonic. "ielts" = an estimated IELTS band range like "6.5-7.5". Translations are short and in native script.`,
        },
        {
          role: "user",
          content: context ? `Word: ${word}\nDictionary meaning: ${context}` : `Word: ${word}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "explanation", strict: true, schema: aiSchema },
      },
    }),
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = body.choices?.[0]?.message?.content;
  return content ? (JSON.parse(content) as Record<string, unknown>) : null;
}

async function handle(word: string, level: Level) {
  const term = word.trim().slice(0, 80);
  if (!term) return json({ error: "Missing word" }, 400);

  const entry = await fetchDictionaryEntry(term);
  const context = entry?.meanings[0]?.definitions[0]?.definition ?? "";
  let ai: Record<string, unknown> | null = null;
  try {
    ai = await explain(term, context, level);
  } catch {
    ai = null;
  }
  if (!entry && !ai) return json({ error: "No results for that word." }, 404);

  return json({
    word: entry?.word ?? term,
    phonetic: entry?.phonetic ?? entry?.phonetics.find((p) => p.text)?.text ?? null,
    audio: entry?.phonetics.find((p) => p.audio)?.audio ?? null,
    partOfSpeech: entry?.meanings[0]?.partOfSpeech ?? null,
    definition: context,
    synonyms: entry?.synonyms ?? [],
    antonyms: entry?.antonyms ?? [],
    examples: entry?.meanings
      .flatMap((m) => m.definitions.map((d) => d.example))
      .filter(Boolean)
      .slice(0, 2),
    ai,
  });
}

export const Route = createFileRoute("/api/public/lookup")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204, headers: cors }),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        return handle(
          url.searchParams.get("word") ?? "",
          (url.searchParams.get("level") as Level) || "beginner",
        );
      },
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as {
          word?: string;
          level?: Level;
        };
        return handle(body.word ?? "", body.level ?? "beginner");
      },
    },
  },
});
