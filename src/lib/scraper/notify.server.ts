// Turns newly opened jobs into notifications: one in-app note + at most one email per company per subscriber per run.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { sendCompanyJobsEmail } from "./email.server";

type Db = SupabaseClient<Database>;

export async function notifyNewJobs(db: Db, siteUrl: string) {
  const { data: jobs } = await db.from("jobs").select("id, title, location_label, summary, company_id, companies(name)").eq("status", "open").is("notified_at", null).limit(200);
  if (!jobs?.length) return { companies: 0, inApp: 0, emails: 0 };
  const byCompany = new Map<string, typeof jobs>();
  for (const j of jobs) byCompany.set(j.company_id, [...(byCompany.get(j.company_id) ?? []), j]);
  let inApp = 0, emails = 0;
  for (const [companyId, list] of byCompany) {
    const name = (list[0]!.companies as { name: string } | null)?.name ?? "A company";
    const first = list[0]!;
    const title = list.length === 1 ? `${name} just posted: ${first.title}` : `${name} just posted ${list.length} new roles`;
    const { data: follows } = await db.from("company_follows").select("user_id, email_opt_in").eq("company_id", companyId);
    if (follows?.length) {
      await db.from("notifications").insert(follows.map((f) => ({ user_id: f.user_id, company_id: companyId, job_id: first.id, title, body: list.map((j) => j.title).slice(0, 5).join(" · ") })));
      inApp += follows.length;
    }
    const recipients = new Set<string>();
    for (const f of follows ?? []) {
      if (!f.email_opt_in) continue;
      const { data } = await db.auth.admin.getUserById(f.user_id);
      if (data.user?.email) recipients.add(data.user.email.toLowerCase());
    }
    const { data: guests } = await db.from("guest_subscriptions").select("email").eq("company_id", companyId);
    for (const g of guests ?? []) recipients.add(g.email.toLowerCase());
    const payload = { company: name, jobs: list.slice(0, 5).map((j) => ({ title: j.title, location: j.location_label, summary: j.summary ?? "", url: `${siteUrl}/jobs/${j.id}` })) };
    for (const to of recipients) if (await sendCompanyJobsEmail(to, payload, `jobs-${companyId}-${first.id}`)) emails++;
    await db.from("jobs").update({ notified_at: new Date().toISOString() }).in("id", list.map((j) => j.id));
  }
  return { companies: byCompany.size, inApp, emails };
}
