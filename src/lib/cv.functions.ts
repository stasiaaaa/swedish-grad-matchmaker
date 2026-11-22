import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CvSchema = z.object({
  university: z.string().nullable(),
  programme: z.string().nullable(),
  study_level: z.enum(["Bachelor", "Master", "PhD"]).nullable(),
  grad_year: z.number().int().nullable(),
  skills: z.array(z.object({ skill: z.string(), level: z.enum(["Beginner", "Intermediate", "Advanced"]) })),
  experiences: z.array(z.object({
    title: z.string(),
    company: z.string(),
    start_date: z.string().nullable(),
    end_date: z.string().nullable(),
    description: z.string().nullable(),
  })),
});
export type ParsedCv = z.infer<typeof CvSchema>;

export const parseCv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      fileName: z.string().max(200),
      pdfBase64: z.string().max(14_000_000).nullable(),
      text: z.string().max(60_000).nullable(),
      knownSkills: z.array(z.string()).max(400),
      knownUniversities: z.array(z.string()).max(200),
    }).refine((d) => d.pdfBase64 || d.text, "Empty file").parse(input),
  )
  .handler(async ({ data }): Promise<{ ok: true; cv: ParsedCv } | { ok: false; error: string }> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { ok: false, error: "AI is not configured." };
    const { createOpenAI } = await import("@ai-sdk/openai");
    const { streamText, Output } = await import("ai");
    const { createLovableAiGatewayRunIdFetch } = await import("./ai/run-id.server");
    const runIdFetch = createLovableAiGatewayRunIdFetch();
    const provider = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
      fetch: runIdFetch.fetch,
    });
    const instructions = `You extract a student's CV into structured data for a Swedish engineering job platform.
Rules:
- university: pick the closest match from this list if possible, else the name as written: ${data.knownUniversities.join("; ")}
- programme: the degree programme name in English (e.g. "Computer Science and Engineering", "Software Engineering"). If they only took separate courses, write "Single-subject courses".
- study_level: the highest current or completed level. grad_year: expected or actual graduation year.
- skills: map to names from this list whenever possible (use exact spelling), add others only if clearly stated: ${data.knownSkills.join("; ")}
  level: Advanced if used professionally or extensively, Intermediate if in projects/courses, Beginner if only mentioned.
- experiences: jobs, internships, theses and substantial projects. Dates as YYYY-MM-DD (use day 01 if unknown), null if absent or ongoing end.
- Use null for anything not in the CV. Never invent.`;
    const content = data.pdfBase64
      ? [{ type: "text" as const, text: "Extract this CV." }, { type: "file" as const, filename: data.fileName, data: data.pdfBase64, mediaType: "application/pdf" }]
      : [{ type: "text" as const, text: `Extract this CV:\n\n${data.text}` }];
    try {
      const result = streamText({
        model: provider.responses("openai/gpt-6-astra"),
        instructions,
        messages: [{ role: "user", content }],
        output: Output.object({ schema: CvSchema }),
        providerOptions: {
          openai: { forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] },
        },
      });
      const cv = await result.output;
      return { ok: true, cv };
    } catch (e) {
      const err = e as { statusCode?: number; message?: string };
      console.error("CV parse failed", err.statusCode, err.message);
      if (err.statusCode === 429) return { ok: false, error: "Too many requests right now. Please try again in a minute." };
      if (err.statusCode === 402) return { ok: false, error: "AI credits have run out. Please add details manually for now." };
      return { ok: false, error: "We couldn't read this CV. You can add your details manually." };
    }
  });
