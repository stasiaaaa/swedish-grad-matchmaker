// AI normalisation for new/changed jobs; marks irrelevant ones as rejected.
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { ROLE_TYPES } from "@/lib/domain";

const Out = z.object({
  relevant: z.boolean(),
  looking_for: z.enum(["thesis", "internship", "graduate", "student_job", "full_time"]),
  role_type: z.enum(ROLE_TYPES as unknown as [string, ...string[]]),
  work_mode: z.enum(["onsite", "hybrid", "remote"]),
  min_level: z.enum(["Bachelor", "Master", "PhD"]).nullable(),
  title_en: z.string(),
  summary: z.string(),
  key_requirements: z.array(z.string()).max(6),
  required_skills: z.array(z.string()).max(12),
  nice_skills: z.array(z.string()).max(8),
});

export async function enrichJob(db: SupabaseClient<Database>, jobId: string, skillNames: string[]) {
  const { data: j } = await db.from("jobs").select("id, title, description, location_label, company_id, companies(name)").eq("id", jobId).single();
  if (!j) return;
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI not configured");
  const { createOpenAI } = await import("@ai-sdk/openai");
  const { streamText, Output } = await import("ai");
  const provider = createOpenAI({ baseURL: "https://ai.gateway.lovable.dev/v1", apiKey, headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" } });
  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    instructions: `You classify job listings for a platform for MSc engineering students and recent graduates in Sweden.
relevant=false for roles that clearly need no university engineering/tech/business degree (e.g. technicians, warehouse, nurses, drivers, sales clerks) or need 5+ years of senior experience.
looking_for: thesis (master thesis/examensarbete/degree project), internship (praktik/sommarjobb), graduate (graduate/trainee programme), student_job (part-time while studying), else full_time.
title_en: the title in English. summary: 2-3 sentences in English. key_requirements: short English bullets.
required_skills/nice_skills: use exact names from this list when possible: ${skillNames.join("; ")}`,
    prompt: `Company: ${(j.companies as { name: string } | null)?.name}\nTitle: ${j.title}\nLocation: ${j.location_label}\n\n${(j.description ?? "").slice(0, 5000)}`,
    output: Output.object({ schema: Out }),
    providerOptions: { openai: { forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] } },
  });
  const output = await result.output;
  await db.from("jobs").update({
    status: output.relevant ? "open" : "rejected",
    looking_for: output.looking_for, role_type: output.role_type, work_mode: output.work_mode, min_level: output.min_level,
    title: output.title_en.slice(0, 200), summary: output.summary, key_requirements: output.key_requirements,
    required_skills: output.required_skills, nice_skills: output.nice_skills,
  }).eq("id", j.id);
  return j.company_id;
}
