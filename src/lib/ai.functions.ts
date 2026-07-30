import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ExplainInput = z.object({ query: z.string().min(1).max(400) });

export type Explanation = {
  word: string;
  phonetic: string;
  partOfSpeech: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  meaning: string;
  aiExplanation: string;
  translation: string;
  examples: string[];
  synonyms: string[];
  antonyms: string[];
  related: string[];
};

const schema = {
  type: "object",
  properties: {
    word: { type: "string" },
    phonetic: { type: "string" },
    partOfSpeech: { type: "string" },
    level: { type: "string", enum: ["Beginner", "Intermediate", "Advanced"] },
    meaning: { type: "string" },
    aiExplanation: { type: "string" },
    translation: { type: "string" },
    examples: { type: "array", items: { type: "string" } },
    synonyms: { type: "array", items: { type: "string" } },
    antonyms: { type: "array", items: { type: "string" } },
    related: { type: "array", items: { type: "string" } },
  },
  required: [
    "word",
    "phonetic",
    "partOfSpeech",
    "level",
    "meaning",
    "aiExplanation",
    "translation",
    "examples",
    "synonyms",
    "antonyms",
    "related",
  ],
  additionalProperties: false,
} as const;

export const explainTerm = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ExplainInput.parse(input))
  .handler(async ({ data }): Promise<Explanation> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI is not configured yet.");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-3-flash",
        messages: [
          {
            role: "system",
            content:
              "You explain English words, phrases and sentences for language learners. Keep the meaning to one sentence, aiExplanation to 2-3 friendly sentences, translation in Hindi, 2-3 examples, and up to 4 items per list. Use IPA for phonetic.",
          },
          { role: "user", content: `Explain: ${data.query}` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "explanation", strict: true, schema },
        },
      }),
    });

    if (res.status === 429) throw new Error("Too many requests right now. Please retry shortly.");
    if (res.status === 402) throw new Error("AI credits exhausted. Please add credits to continue.");
    if (!res.ok) throw new Error(`AI request failed (${res.status}).`);

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error("The AI returned an empty response.");
    return JSON.parse(content) as Explanation;
  });
