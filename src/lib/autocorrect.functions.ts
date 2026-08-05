import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const AutocorrectInput = z.object({
  text: z.string().min(1).max(4000),
});

export type CorrectionKind = "spelling" | "grammar" | "punctuation" | "style";

export type Correction = {
  original: string;
  corrected: string;
  type: CorrectionKind;
  explanation: string;
};

export type AutocorrectResult = {
  correctedText: string;
  summary: string;
  corrections: Correction[];
};

const schema = {
  type: "object",
  properties: {
    correctedText: { type: "string" },
    summary: { type: "string" },
    corrections: {
      type: "array",
      items: {
        type: "object",
        properties: {
          original: { type: "string" },
          corrected: { type: "string" },
          type: { type: "string", enum: ["spelling", "grammar", "punctuation", "style"] },
          explanation: { type: "string" },
        },
        required: ["original", "corrected", "type", "explanation"],
        additionalProperties: false,
      },
    },
  },
  required: ["correctedText", "summary", "corrections"],
  additionalProperties: false,
} as const;

export const autocorrectText = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AutocorrectInput.parse(input))
  .handler(async ({ data }): Promise<AutocorrectResult> => {
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
              "You are an English proofreader. Fix spelling, grammar and punctuation while keeping the author's meaning, tone and formatting. Return the full corrected text in 'correctedText'. List every change in 'corrections' with the exact original fragment, the corrected fragment, its type and a one-line beginner-friendly explanation. If nothing needs fixing, return the text unchanged with an empty corrections array. Keep 'summary' to one short sentence.",
          },
          { role: "user", content: data.text },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "autocorrect", strict: true, schema },
        },
      }),
    });

    if (res.status === 429) throw new Error("Too many requests right now. Please retry shortly.");
    if (res.status === 402) throw new Error("AI credits are exhausted. Please top up to continue.");
    if (!res.ok) throw new Error(`Autocorrect failed (${res.status}).`);

    const payload = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error("The AI returned an empty response.");
    return JSON.parse(content) as AutocorrectResult;
  });
