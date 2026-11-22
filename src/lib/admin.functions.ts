import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Admins only");
}

export const detectSourceFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ url: z.string().max(500) }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { detectSource } = await import("@/lib/scraper/collect.server");
    return detectSource(data.url);
  });

export const testConnectionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ companyId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { fromJobTech, fromAts } = await import("@/lib/scraper/collect.server");
    const { data: c } = await context.supabase.from("companies").select("*").eq("id", data.companyId).single();
    if (!c) throw new Error("Company not found");
    const out: { source: string; count: number; error?: string; sample?: string[] }[] = [];
    try { const r = await fromJobTech(c); out.push({ source: "Arbetsförmedlingen", count: r.length, sample: r.slice(0, 3).map((x) => x.title) }); } catch (e) { out.push({ source: "Arbetsförmedlingen", count: 0, error: (e as Error).message }); }
    if (c.ats_identifier) {
      try { const r = await fromAts(c); out.push({ source: c.source_type, count: r.length, sample: r.slice(0, 3).map((x) => x.title) }); } catch (e) { out.push({ source: c.source_type, count: 0, error: (e as Error).message }); }
    }
    return out;
  });
