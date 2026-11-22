import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const subscribeGuest = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ email: z.string().trim().toLowerCase().email().max(254), companyId: z.string().uuid(), consent: z.literal(true), website: z.string().max(0).optional() }).parse(i))
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const hourAgo = new Date(Date.now() - 3600_000).toISOString();
    const minuteAgo = new Date(Date.now() - 60_000).toISOString();
    const [mine, all] = await Promise.all([
      db.from("guest_subscriptions").select("id", { count: "exact", head: true }).eq("email", data.email).gte("created_at", hourAgo),
      db.from("guest_subscriptions").select("id", { count: "exact", head: true }).gte("created_at", minuteAgo),
    ]);
    if ((mine.count ?? 0) >= 10 || (all.count ?? 0) >= 30) return { ok: false, error: "Too many sign-ups right now. Please try again later." };
    const { error } = await db.from("guest_subscriptions").upsert({ email: data.email, company_id: data.companyId, consent_at: new Date().toISOString() }, { onConflict: "email,company_id" });
    if (error) return { ok: false, error: "Could not save your email." };
    return { ok: true };
  });
