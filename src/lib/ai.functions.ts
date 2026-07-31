import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ExplainInput = z.object({
  word: z.string().min(1).max(120),
  context: z.string().max(600).optional(),
});

export type AiExplanation = {
  simple: string;
  eli10: string;
  hindi: string;
  gujarati: string;
  memoryTrick: string;
  realLifeExamples: string[];
  usageTips: string[];
};

export type AiStatus = { configured: boolean };

const schema = {
  type: "object",
  properties: {
    simple: { type: "string" },
    eli10: { type: "string" },
    hindi: { type: "string" },
    gujarati: { type: "string" },
    memoryTrick: { type: "string" },
    realLifeExamples: { type: "array", items: { type: "string" } },
    usageTips: { type: "array", items: { type: "string" } },
  },
  required: [
    "simple",
    "eli10",
    "hindi",
    "gujarati",
    "memoryTrick",
    "realLifeExamples",
    "usageTips",
  ],
  additionalProperties: false,
} as const;

/** Lets the UI show a "ready for AI" state instead of an error when no key exists. */
export const getAiStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<AiStatus> => ({ configured: Boolean(process.env.LOVABLE_API_KEY) }),
);

export const explainWord = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ExplainInput.parse(input))
  .handler(async ({ data }): Promise<AiExplanation> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI is not connected yet.");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [
          {
            role: "system",
            content:
              "You help English learners understand words. Keep 'simple' to one clear sentence, 'eli10' playful and very easy, 'hindi' and 'gujarati' as short natural translations plus a short gloss in that script, 'memoryTrick' one vivid mnemonic, 2-3 realLifeExamples as full sentences, and 2-3 short usageTips.",
          },
          {
            role: "user",
            content: data.context
              ? `Word: ${data.word}\nDictionary meaning: ${data.context}`
              : `Word: ${data.word}`,
          },
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

    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error("The AI returned an empty response.");
    return JSON.parse(content) as AiExplanation;
  });
