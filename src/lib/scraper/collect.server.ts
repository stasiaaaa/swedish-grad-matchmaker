// Job collection: JobTech (main) + ATS feeds (Lever, Greenhouse, Workable, Teamtailor).
// Runs in small ticks so each scheduled call finishes within seconds.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { ROLE_TYPES } from "@/lib/domain";

type Db = SupabaseClient<Database>;
type Company = Database["public"]["Tables"]["companies"]["Row"];
type Raw = { source: string; external_id: string; title: string; city: string; location_label: string; url: string; description: string; posted_at: string | null; deadline: string | null; lat: number | null; lng: number | null; remote: boolean };

const UA = "LaunchPadJobBot/1.0 (+student job matching; links back to original listings)";
// Regions = the three cities plus their commuting areas.
const JOBTECH_REGIONS: Record<string, string> = { oLT3_Q9p_3nn: "linkoping", CifL_Rzy_Mku: "stockholm", zdoY_6u5_Krt: "gothenburg" };
const REGION_CODE: Record<string, string> = { "05": "linkoping", "01": "stockholm", "14": "gothenburg" };
const CENTER: Record<string, [number, number]> = { linkoping: [58.41, 15.62], stockholm: [59.33, 18.07], gothenburg: [57.71, 11.97] };
const CITY_WORDS: [RegExp, string][] = [[/link[oö]ping/i, "linkoping"], [/stockholm|solna|kista|sundbyberg|nacka|lidingö/i, "stockholm"], [/g[oö]teborg|gothenburg|m[oö]lndal/i, "gothenburg"]];

export function detectSource(url: string | null): { source_type: string; ats_identifier: string | null } {
  if (!url) return { source_type: "jobtech", ats_identifier: null };
  const pats: [RegExp, string][] = [
    [/jobs\.lever\.co\/([^/?#]+)/, "lever"], [/boards(?:-api)?\.greenhouse\.io\/(?:v1\/boards\/)?([^/?#]+)/, "greenhouse"],
    [/([a-z0-9-]+)\.teamtailor\.com/, "teamtailor"], [/apply\.workable\.com\/([^/?#]+)/, "workable"], [/([a-z0-9-]+)\.workable\.com/, "workable"],
    [/([a-z0-9-]+)\.varbi\.com/, "varbi"], [/([a-z0-9-]+)\.reachmee\.com/, "reachmee"], [/jobylon\.com\/companies\/([^/?#]+)/, "jobylon"],
    [/jobs\.ashbyhq\.com\/([^/?#]+)/, "ashby"], [/([a-z0-9-]+)\.wd\d+\.myworkdayjobs\.com/, "workday"],
  ];
  for (const [re, t] of pats) { const m = url.match(re); if (m) return { source_type: t, ats_identifier: m[1] ?? null }; }
  return { source_type: "jobtech", ats_identifier: null };
}

async function getJson(url: string, ms = 6000): Promise<unknown> {
  const r = await fetch(url, { headers: { "User-Agent": UA, accept: "application/json" }, signal: AbortSignal.timeout(ms) });
  if (!r.ok) throw new Error(`${new URL(url).host} ${r.status}`);
  return r.json();
}
const strip = (h: string) => h.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
function cityOf(text: string): string | null { for (const [re, c] of CITY_WORDS) if (re.test(text)) return c; return null; }
function domainRoot(u: string | null | undefined): string | null { if (!u) return null; try { const p = new URL(u.startsWith("http") ? u : `https://${u}`).hostname.split("."); return p.length >= 2 ? p[p.length - 2]! : null; } catch { return null; } }
const norm = (s: string) => s.toLowerCase().replace(/\b(ab|aktiebolag|group|sverige|sweden|publ)\b/g, "").replace(/[^a-z0-9åäö]/g, "");

export async function fromJobTech(c: Company): Promise<Raw[]> {
  const munis = Object.keys(JOBTECH_REGIONS).map((m) => `region=${m}`).join("&");
  const tokens = c.name.toLowerCase().split(/[^a-z0-9åäö]+/).filter((t) => t.length > 1 && !["ab", "group", "the"].includes(t)).map((t) => t.replace(/s$/, ""));
  const root = domainRoot(c.website) ?? domainRoot(c.careers_url);
  const out: Raw[] = [];
  for (const q of [c.name, `${c.name} thesis`, `${c.name} examensarbete`]) {
    const d = (await getJson(`https://jobsearch.api.jobtechdev.se/search?q=${encodeURIComponent(q)}&${munis}&limit=100`)) as { hits: any[] };
    for (const h of d.hits ?? []) {
      const emp = `${h.employer?.name ?? ""} ${h.employer?.workplace ?? ""}`;
      const orgOk = !!c.org_number && h.employer?.organization_number?.replace(/\D/g, "") === c.org_number.replace(/\D/g, "");
      const nameOk = tokens.length > 0 && tokens.every((t) => norm(emp).includes(t));
      const domOk = !!root && domainRoot(h.employer?.url) === root;
      if (!orgOk && !nameOk && !domOk) continue;
      const city = REGION_CODE[h.workplace_address?.region_code] ?? null;
      if (!city || out.some((o) => o.external_id === String(h.id))) continue;
      const co = h.workplace_address?.coordinates;
      out.push({ source: "jobtech", external_id: String(h.id), title: h.headline, city, location_label: h.workplace_address?.municipality ?? city,
        url: h.application_details?.url || h.webpage_url, description: (h.description?.text ?? "").slice(0, 6000),
        posted_at: h.publication_date ?? null, deadline: h.application_deadline?.slice(0, 10) ?? null,
        lat: Array.isArray(co) && co[1] ? co[1] : null, lng: Array.isArray(co) && co[0] ? co[0] : null, remote: false });
    }
  }
  return out;
}

export async function fromAts(c: Company): Promise<Raw[]> {
  const id = c.ats_identifier; if (!id) return [];
  const out: Raw[] = [];
  const push = (r: Omit<Raw, "city" | "remote" | "location_label"> & { loc: string; remoteHint?: boolean }) => {
    const city = cityOf(r.loc);
    const remote = !!r.remoteHint && /sweden|sverige|stockholm|göteborg|linköping/i.test(r.loc);
    if (!city && !remote) return;
    const { loc, remoteHint, ...rest } = r; void remoteHint;
    out.push({ ...rest, city: city ?? "remote", location_label: loc, remote });
  };
  if (c.source_type === "lever") {
    const d = (await getJson(`https://api.lever.co/v0/postings/${id}?mode=json`)) as any[];
    for (const j of d) push({ source: "lever", external_id: j.id, title: j.text, loc: `${j.categories?.location ?? ""} ${(j.categories?.allLocations ?? []).join(" ")}`, url: j.hostedUrl, description: (j.descriptionPlain ?? "").slice(0, 6000), posted_at: j.createdAt ? new Date(j.createdAt).toISOString() : null, deadline: null, lat: null, lng: null, remoteHint: j.workplaceType === "remote" });
  } else if (c.source_type === "greenhouse") {
    const d = (await getJson(`https://boards-api.greenhouse.io/v1/boards/${id}/jobs?content=true`)) as { jobs: any[] };
    for (const j of d.jobs ?? []) push({ source: "greenhouse", external_id: String(j.id), title: j.title, loc: j.location?.name ?? "", url: j.absolute_url, description: strip(j.content ?? "").slice(0, 6000), posted_at: j.updated_at ?? null, deadline: null, lat: null, lng: null, remoteHint: /remote/i.test(j.location?.name ?? "") });
  } else if (c.source_type === "workable") {
    const d = (await getJson(`https://apply.workable.com/api/v1/widget/accounts/${id}`)) as { jobs: any[] };
    for (const j of d.jobs ?? []) push({ source: "workable", external_id: j.shortcode, title: j.title, loc: `${j.city ?? ""} ${j.country ?? ""}`, url: j.url, description: "", posted_at: j.published_on ?? null, deadline: null, lat: null, lng: null, remoteHint: !!j.telecommuting });
  } else if (c.source_type === "teamtailor") {
    const r = await fetch(`https://${id}.teamtailor.com/jobs.rss`, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(6000) });
    if (!r.ok) throw new Error(`teamtailor ${r.status}`);
    const xml = await r.text();
    for (const it of xml.split("<item>").slice(1)) {
      const g = (t: string) => (it.match(new RegExp(`<${t}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${t}>`))?.[1] ?? "").trim();
      push({ source: "teamtailor", external_id: g("guid") || g("link"), title: g("title"), loc: `${g("tt:city")} ${g("tt:location")} ${g("description").slice(0, 300)}`, url: g("link"), description: strip(g("description")).slice(0, 6000), posted_at: g("pubDate") ? new Date(g("pubDate")).toISOString() : null, deadline: null, lat: null, lng: null, remoteHint: /remote/i.test(g("tt:remote-status")) });
    }
  }
  return out;
}

const hash = async (s: string) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-1", new TextEncoder().encode(s)))).map((b) => b.toString(16).padStart(2, "0")).join("");
const normTitle = (s: string) => s.toLowerCase().replace(/[^a-z0-9åäö]+/g, " ").trim();

export async function currentRun(db: Db): Promise<Database["public"]["Tables"]["scrape_runs"]["Row"]> {
  const since = new Date(Date.now() - 3 * 3600_000).toISOString();
  const { data } = await db.from("scrape_runs").select("*").gte("started_at", since).order("started_at", { ascending: false }).limit(1).maybeSingle();
  if (data) return data;
  const { data: created, error } = await db.from("scrape_runs").insert({}).select("*").single();
  if (error) throw error;
  return created;
}

/** Collect one company. Returns counters. Never throws for source errors. */
export async function collectCompany(db: Db, c: Company) {
  const stats = { new: 0, updated: 0, closed: 0, error: null as string | null };
  let raws: Raw[] = [];
  const errors: string[] = [];
  let source = c.source_type;
  if (source === "auto") { const d = detectSource(c.careers_url); source = d.source_type; c = { ...c, ...d }; await db.from("companies").update(d).eq("id", c.id); }
  try { raws.push(...(await fromJobTech(c))); } catch (e) { errors.push(`JobTech: ${(e as Error).message}`); }
  if (["lever", "greenhouse", "workable", "teamtailor"].includes(source)) {
    try {
      const ats = await fromAts(c);
      // Cross-source dedupe: prefer ATS version.
      const keys = new Set(ats.map((a) => `${normTitle(a.title)}|${a.city}`));
      raws = [...ats, ...raws.filter((r) => !keys.has(`${normTitle(r.title)}|${r.city}`))];
    } catch (e) { errors.push(`${source}: ${(e as Error).message}`); }
  }
  const now = new Date().toISOString();
  const failed = errors.length > 0 && raws.length === 0;
  if (failed) {
    const fails = c.consecutive_failures + 1;
    await db.from("companies").update({ last_scraped_at: now, last_status: `error: ${errors.join("; ")}`.slice(0, 300), consecutive_failures: fails }).eq("id", c.id);
    stats.error = `${c.name}: ${errors.join("; ")}`;
    return stats;
  }
  const { data: existing } = await db.from("jobs").select("id, source, external_id, content_hash, status, missed_runs").eq("company_id", c.id).neq("source", "seed");
  const byKey = new Map((existing ?? []).map((j) => [`${j.source}|${j.external_id}`, j]));
  const seen = new Set<string>();
  for (const r of raws) {
    const key = `${r.source}|${r.external_id}`; seen.add(key);
    const h = await hash(`${r.title}|${r.description}|${r.location_label}`);
    const ex = byKey.get(key);
    const [jl, jg] = CENTER[r.city] ?? [null, null];
    const jitter = () => (Math.random() - 0.5) * 0.04;
    const base = { title: r.title.slice(0, 200), location_label: r.location_label.slice(0, 120), source_url: r.url, description: r.description, deadline: r.deadline, last_seen_at: now, missed_runs: 0, content_hash: h };
    if (!ex) {
      const { error } = await db.from("jobs").insert({ ...base, company_id: c.id, source: r.source, external_id: r.external_id, city: r.city, status: "pending", looking_for: "full_time", role_type: ROLE_TYPES[0], work_mode: r.remote ? "remote" : "onsite", lat: r.lat ?? (jl != null ? jl + jitter() : null), lng: r.lng ?? (jg != null ? jg + jitter() : null), posted_at: r.posted_at ?? now, first_seen_at: now });
      if (!error) stats.new++;
    } else if (ex.content_hash !== h) {
      await db.from("jobs").update({ ...base, status: ex.status === "rejected" ? "rejected" : "pending" }).eq("id", ex.id); stats.updated++;
    } else {
      await db.from("jobs").update({ last_seen_at: now, missed_runs: 0, ...(ex.status === "closed" ? { status: "open" } : {}) }).eq("id", ex.id);
    }
  }
  // Closing: not seen in 2 consecutive runs.
  for (const j of existing ?? []) {
    if (seen.has(`${j.source}|${j.external_id}`) || j.status === "closed") continue;
    const missed = j.missed_runs + 1;
    await db.from("jobs").update({ missed_runs: missed, ...(missed >= 2 ? { status: "closed" } : {}) }).eq("id", j.id);
    if (missed >= 2) stats.closed++;
  }
  const firstRun = !c.last_scraped_at;
  const upd: Database["public"]["Tables"]["companies"]["Update"] = { last_scraped_at: now, consecutive_failures: 0, last_status: `ok: ${raws.length} listings${errors.length ? ` (${errors.join("; ")})` : ""}`.slice(0, 300) };
  if (raws.length === 0 && firstRun) { upd.scrape_enabled = false; upd.scrape_disabled_reason = "needs manual check"; upd.last_status = "0 jobs from all sources"; }
  await db.from("companies").update(upd).eq("id", c.id);
  return stats;
}

/** After AI review: active vs watched status. */
export async function refreshCompanyStatus(db: Db, companyId: string) {
  const { data: open } = await db.from("jobs").select("posted_at").eq("company_id", companyId).eq("status", "open").order("posted_at", { ascending: false });
  if (open && open.length) { await db.from("companies").update({ is_watched: false, last_posting_at: open[0]!.posted_at }).eq("id", companyId); return; }
  const { data: c } = await db.from("companies").select("last_posting_at, is_watched").eq("id", companyId).single();
  if (c && !c.is_watched && (!c.last_posting_at || Date.now() - new Date(c.last_posting_at).getTime() > 30 * 86400_000)) await db.from("companies").update({ is_watched: true }).eq("id", companyId);
}
