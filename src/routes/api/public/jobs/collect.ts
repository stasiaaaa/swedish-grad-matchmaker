import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

// Called every few minutes. Real work happens only in the 06:00 and 18:00 Swedish-time windows
// (or for companies never checked). Each call handles a small batch so it finishes quickly.
const TICK_BUDGET_MS = 8000;

function stockholmHour(d = new Date()) {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Stockholm", hour: "2-digit", hour12: false }).format(d));
}

export const Route = createFileRoute("/api/public/jobs/collect")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authFailure = await authenticateCronRequest(request);
        if (authFailure) return authFailure;
        const t0 = Date.now();
        const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
        const { collectCompany, currentRun, refreshCompanyStatus } = await import("@/lib/scraper/collect.server");
        const { enrichJob } = await import("@/lib/scraper/enrich.server");
        const inWindow = [6, 18].includes(stockholmHour());
        const staleBefore = new Date(Date.now() - 6 * 3600_000).toISOString();

        let q = db.from("companies").select("*").eq("scrape_enabled", true).order("tier").order("last_scraped_at", { ascending: true, nullsFirst: true }).limit(1);
        q = inWindow ? q.or(`last_scraped_at.is.null,last_scraped_at.lt.${staleBefore}`) : q.is("last_scraped_at", null);
        const { data: companies } = await q;
        const pending = (await db.from("jobs").select("id", { count: "exact", head: true }).eq("status", "pending")).count ?? 0;
        if (!companies?.length && !pending) return Response.json({ idle: true });

        const run = await currentRun(db);
        const totals = { companies_checked: run.companies_checked, jobs_new: run.jobs_new, jobs_updated: run.jobs_updated, jobs_closed: run.jobs_closed };
        const errors = [...((run.errors as string[]) ?? [])];
        const touched = new Set<string>();
        for (const c of companies ?? []) {
          if (Date.now() - t0 > TICK_BUDGET_MS / 2) break;
          const s = await collectCompany(db, c);
          totals.companies_checked++; totals.jobs_new += s.new; totals.jobs_updated += s.updated; totals.jobs_closed += s.closed;
          if (s.error) errors.push(s.error);
          if (s.closed) touched.add(c.id);
          await new Promise((r) => setTimeout(r, 1000));
        }
        // AI-normalise a few pending jobs in parallel.
        const { data: todo } = await db.from("jobs").select("id").eq("status", "pending").order("first_seen_at").limit(5);
        if (todo?.length && Date.now() - t0 < TICK_BUDGET_MS) {
          const { data: skills } = await db.from("skills").select("name");
          const names = (skills ?? []).map((s) => s.name);
          const res = await Promise.allSettled(todo.map((j) => enrichJob(db, j.id, names)));
          for (const r of res) if (r.status === "fulfilled" && r.value) touched.add(r.value); else if (r.status === "rejected") errors.push(`AI: ${String(r.reason).slice(0, 120)}`);
        }
        for (const id of touched) await refreshCompanyStatus(db, id);
        const { notifyNewJobs } = await import("@/lib/scraper/notify.server");
        const notified = await notifyNewJobs(db, new URL(request.url).origin);
        // Retire the sample jobs once enough real ones exist.
        const real = (await db.from("jobs").select("id", { count: "exact", head: true }).eq("status", "open").neq("source", "seed")).count ?? 0;
        if (real >= 20) await db.from("jobs").update({ status: "closed" }).eq("source", "seed").eq("status", "open");
        await db.from("scrape_runs").update({ ...totals, errors: errors.slice(-50), finished_at: new Date().toISOString() }).eq("id", run.id);
        return Response.json({ ok: true, ...totals, notified });
      },
    },
  },
});
