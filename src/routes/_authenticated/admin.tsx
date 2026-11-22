import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Plug, Plus, Search, Upload, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { myProfileQuery } from "@/lib/account";
import { CITIES, cityLabel, timeAgo } from "@/lib/domain";
import { detectSourceFn, testConnectionFn } from "@/lib/admin.functions";
import type { Database } from "@/integrations/supabase/types";

type Company = Database["public"]["Tables"]["companies"]["Row"];
const SOURCES = ["auto", "jobtech", "greenhouse", "lever", "workable", "teamtailor", "varbi", "reachmee", "jobylon", "ashby", "workday", "custom_html"];

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin · LaunchPad" }, { name: "description", content: "Manage companies and job collection." }, { property: "og:title", content: "Admin · LaunchPad" }, { property: "og:description", content: "Manage companies and job collection." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function AdminPage() {
  const { user } = useAuth();
  const { data: me, isLoading } = useQuery(myProfileQuery(user?.id));
  if (isLoading) return <main className="mx-auto max-w-6xl px-4 py-10 text-muted-foreground">Loading…</main>;
  if (!me?.roles.includes("admin")) return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Admins only</h1>
      <p className="mt-2 text-muted-foreground">This page is for LaunchPad admins.</p>
      <Button asChild className="mt-4"><Link to="/jobs">Back to jobs</Link></Button>
    </main>
  );
  return <AdminInner />;
}

function AdminInner() {
  const qc = useQueryClient();
  const companies = useQuery({ queryKey: ["admin-companies"], queryFn: async () => (await supabase.from("companies").select("*").order("tier").order("name")).data ?? [] });
  const counts = useQuery({ queryKey: ["admin-counts"], queryFn: async () => {
    const { data } = await supabase.from("jobs").select("company_id").eq("status", "open");
    const m: Record<string, number> = {}; for (const j of data ?? []) m[j.company_id] = (m[j.company_id] ?? 0) + 1; return m;
  } });
  const runs = useQuery({ queryKey: ["admin-runs"], queryFn: async () => (await supabase.from("scrape_runs").select("*").order("started_at", { ascending: false }).limit(10)).data ?? [] });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-companies"] }); qc.invalidateQueries({ queryKey: ["admin-counts"] }); };
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Partial<Company> | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Database["public"]["Tables"]["companies"]["Update"] }) => { const { error } = await supabase.from("companies").update(patch).eq("id", id); if (error) throw error; },
    onSuccess: refresh, onError: (e) => toast.error((e as Error).message),
  });

  const list = (companies.data ?? []).filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
  const flagged = (companies.data ?? []).filter((c) => c.consecutive_failures >= 3 || !c.scrape_enabled);
  const last = runs.data?.[0];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Admin</h1>
      <p className="mt-1 text-muted-foreground">Companies, watched list and job collection health.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <Stat label="Companies" value={companies.data?.length ?? 0} />
        <Stat label="Open jobs" value={Object.values(counts.data ?? {}).reduce((a, b) => a + b, 0)} />
        <Stat label="Last run" value={last ? timeAgo(last.finished_at ?? last.started_at) : "Never"} />
        <Stat label="Need attention" value={flagged.length} warn={flagged.length > 0} />
      </div>

      <Tabs defaultValue="companies" className="mt-8">
        <TabsList><TabsTrigger value="companies">Companies</TabsTrigger><TabsTrigger value="health">Collection health</TabsTrigger></TabsList>

        <TabsContent value="companies" className="mt-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-60 flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Search companies" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <Button onClick={() => setEditing({ tier: 2, source_type: "auto", scrape_enabled: true, is_watched: false })}><Plus className="size-4" />Add company</Button>
            <Button variant="outline" onClick={() => setImportOpen(true)}><Upload className="size-4" />Import CSV</Button>
          </div>
          <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
                <tr><th className="p-3">Company</th><th className="p-3">Tier</th><th className="p-3">Source</th><th className="p-3">Open jobs</th><th className="p-3">Last check</th><th className="p-3">Watched</th><th className="p-3">Collect</th><th className="p-3" /></tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id} className="border-t border-border/70">
                    <td className="p-3"><div className="font-medium">{c.name}</div><div className="text-xs text-muted-foreground">{c.city ? cityLabel[c.city as keyof typeof cityLabel] ?? c.city : "—"} · {c.industry ?? "—"}</div></td>
                    <td className="p-3">{c.tier}</td>
                    <td className="p-3"><Badge variant="secondary">{c.source_type}</Badge>{c.ats_identifier && <div className="text-xs text-muted-foreground">{c.ats_identifier}</div>}</td>
                    <td className="p-3 font-semibold">{counts.data?.[c.id] ?? 0}</td>
                    <td className="p-3 text-xs"><div>{c.last_scraped_at ? timeAgo(c.last_scraped_at) : "Never"}</div><div className={c.last_status?.startsWith("ok") ? "text-muted-foreground" : "text-destructive"}>{c.scrape_disabled_reason ?? c.last_status ?? ""}</div></td>
                    <td className="p-3"><Switch aria-label={`Watch ${c.name}`} checked={c.is_watched} onCheckedChange={(v) => update.mutate({ id: c.id, patch: { is_watched: v } })} /></td>
                    <td className="p-3"><Switch aria-label={`Collect jobs for ${c.name}`} checked={c.scrape_enabled} onCheckedChange={(v) => update.mutate({ id: c.id, patch: { scrape_enabled: v, ...(v ? { scrape_disabled_reason: null, consecutive_failures: 0 } : {}) } })} /></td>
                    <td className="p-3"><Button size="sm" variant="ghost" onClick={() => setEditing(c)}>Edit</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="health" className="mt-4 space-y-6">
          <section>
            <h2 className="font-bold">Needs attention</h2>
            {flagged.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">All companies are collecting fine.</p> : (
              <ul className="mt-2 space-y-2">
                {flagged.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 text-sm">
                    <span className="flex items-center gap-2"><AlertTriangle className="size-4 text-destructive" /><b>{c.name}</b> — {c.scrape_disabled_reason ?? `${c.consecutive_failures} failures in a row`}: {c.last_status}</span>
                    <Button size="sm" variant="outline" onClick={() => setEditing(c)}>Fix</Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section>
            <h2 className="font-bold">Recent runs</h2>
            <div className="mt-2 overflow-x-auto rounded-xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground"><tr><th className="p-3">Started</th><th className="p-3">Companies</th><th className="p-3">New</th><th className="p-3">Updated</th><th className="p-3">Closed</th><th className="p-3">Errors</th></tr></thead>
                <tbody>
                  {(runs.data ?? []).map((r) => (
                    <tr key={r.id} className="border-t border-border/70">
                      <td className="p-3">{new Date(r.started_at).toLocaleString("sv-SE", { timeZone: "Europe/Stockholm" })}</td>
                      <td className="p-3">{r.companies_checked}</td><td className="p-3">{r.jobs_new}</td><td className="p-3">{r.jobs_updated}</td><td className="p-3">{r.jobs_closed}</td>
                      <td className="p-3 text-xs text-destructive">{(r.errors as string[]).slice(-3).join(" · ") || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </TabsContent>
      </Tabs>

      {editing && <CompanyDialog company={editing} onClose={() => setEditing(null)} onSaved={refresh} />}
      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} onDone={refresh} />
    </main>
  );
}

function Stat({ label, value, warn }: { label: string; value: string | number; warn?: boolean }) {
  return <div className="rounded-xl border border-border bg-card p-4"><div className="text-xs text-muted-foreground">{label}</div><div className={`mt-1 text-2xl font-bold ${warn ? "text-destructive" : ""}`}>{value}</div></div>;
}

function CompanyDialog({ company, onClose, onSaved }: { company: Partial<Company>; onClose: () => void; onSaved: () => void }) {
  const [c, setC] = useState(company);
  const [test, setTest] = useState<{ source: string; count: number; error?: string; sample?: string[] }[] | null>(null);
  const set = (k: keyof Company, v: unknown) => setC((p) => ({ ...p, [k]: v }));
  const save = useMutation({
    mutationFn: async () => {
      if (!c.name?.trim()) throw new Error("Name is required");
      const row = { name: c.name.trim(), org_number: c.org_number || null, careers_url: c.careers_url || null, website: c.website || null, city: c.city || null, cities: c.city ? [c.city] : [], industry: c.industry || null, tier: Number(c.tier) || 2, source_type: c.source_type ?? "auto", ats_identifier: c.ats_identifier || null, scrape_enabled: c.scrape_enabled ?? true, is_watched: c.is_watched ?? false, watch_note: c.watch_note || null, hiring_period: c.hiring_period || null };
      const r = c.id ? await supabase.from("companies").update(row).eq("id", c.id) : await supabase.from("companies").insert({ ...row, slug: slugify(row.name) });
      if (r.error) throw r.error;
    },
    onSuccess: () => { toast.success("Saved"); onSaved(); onClose(); },
    onError: (e) => toast.error((e as Error).message),
  });
  const detect = useMutation({
    mutationFn: () => detectSourceFn({ data: { url: c.careers_url ?? "" } }),
    onSuccess: (d) => { setC((p) => ({ ...p, ...d })); toast.success(d.ats_identifier ? `Found ${d.source_type}: ${d.ats_identifier}` : "No job board found — will use Arbetsförmedlingen"); },
    onError: (e) => toast.error((e as Error).message),
  });
  const testM = useMutation({ mutationFn: () => testConnectionFn({ data: { companyId: c.id! } }), onSuccess: setTest, onError: (e) => toast.error((e as Error).message) });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>{c.id ? `Edit ${company.name}` : "Add company"}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <F label="Name"><Input value={c.name ?? ""} onChange={(e) => set("name", e.target.value)} /></F>
          <div className="grid grid-cols-2 gap-3">
            <F label="Org number"><Input value={c.org_number ?? ""} onChange={(e) => set("org_number", e.target.value)} placeholder="556036-0793" /></F>
            <F label="Tier"><Select value={String(c.tier ?? 2)} onValueChange={(v) => set("tier", Number(v))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[1, 2, 3, 4].map((t) => <SelectItem key={t} value={String(t)}>Tier {t}</SelectItem>)}</SelectContent></Select></F>
          </div>
          <F label="Careers page"><div className="flex gap-2"><Input value={c.careers_url ?? ""} onChange={(e) => set("careers_url", e.target.value)} placeholder="https://jobs.lever.co/company" /><Button type="button" variant="outline" onClick={() => detect.mutate()} disabled={!c.careers_url || detect.isPending}><Wand2 className="size-4" />Detect source</Button></div></F>
          <div className="grid grid-cols-2 gap-3">
            <F label="Source"><Select value={c.source_type ?? "auto"} onValueChange={(v) => set("source_type", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></F>
            <F label="Job board ID"><Input value={c.ats_identifier ?? ""} onChange={(e) => set("ats_identifier", e.target.value)} /></F>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <F label="City"><Select value={c.city ?? ""} onValueChange={(v) => set("city", v)}><SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger><SelectContent>{CITIES.map((x) => <SelectItem key={x.key} value={x.key}>{x.label}</SelectItem>)}</SelectContent></Select></F>
            <F label="Industry"><Input value={c.industry ?? ""} onChange={(e) => set("industry", e.target.value)} /></F>
          </div>
          <F label="Why we watch them"><Textarea rows={2} value={c.watch_note ?? ""} onChange={(e) => set("watch_note", e.target.value)} /></F>
          <F label="Typical hiring period"><Input value={c.hiring_period ?? ""} onChange={(e) => set("hiring_period", e.target.value)} placeholder="Usually opens graduate roles in September" /></F>
          <div className="flex gap-6 text-sm">
            <label className="flex items-center gap-2"><Switch checked={c.scrape_enabled ?? true} onCheckedChange={(v) => set("scrape_enabled", v)} />Collect jobs</label>
            <label className="flex items-center gap-2"><Switch checked={c.is_watched ?? false} onCheckedChange={(v) => set("is_watched", v)} />Watched</label>
          </div>
          {c.id && (
            <div className="rounded-lg border border-border p-3">
              <Button type="button" size="sm" variant="outline" onClick={() => testM.mutate()} disabled={testM.isPending}><Plug className="size-4" />{testM.isPending ? "Testing…" : "Test connection"}</Button>
              {test && <ul className="mt-2 space-y-1 text-sm">{test.map((t) => <li key={t.source}><b>{t.source}:</b> {t.error ? <span className="text-destructive">{t.error}</span> : `${t.count} jobs found`}{t.sample?.length ? <span className="text-muted-foreground"> — e.g. {t.sample.join(", ")}</span> : null}</li>)}</ul>}
              <p className="mt-1 text-xs text-muted-foreground">Test uses the saved settings — save first if you changed them.</p>
            </div>
          )}
          <Button onClick={() => save.mutate()} disabled={save.isPending}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-1.5"><Label>{label}</Label>{children}</div>;
}

function parseCsv(text: string) {
  const rows = text.trim().split(/\r?\n/).map((l) => l.split(/[,;](?=(?:[^"]*"[^"]*")*[^"]*$)/).map((x) => x.trim().replace(/^"|"$/g, "")));
  const head = rows[0]?.map((h) => h.toLowerCase()) ?? [];
  return rows.slice(1).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
}

function ImportDialog({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const [text, setText] = useState("");
  const rows = text.trim() ? parseCsv(text) : [];
  const cityKey = (s: string) => CITIES.find((c) => c.key === s.toLowerCase() || c.label.toLowerCase() === s.toLowerCase())?.key ?? (/g[oö]teborg/i.test(s) ? "gothenburg" : null);
  const imp = useMutation({
    mutationFn: async () => {
      const valid = rows.filter((r) => r["name"]);
      const { error } = await supabase.from("companies").upsert(valid.map((r) => {
        const city = cityKey(r["city"] ?? "");
        return { name: r["name"]!, slug: slugify(r["name"]!), org_number: r["org_number"] || null, careers_url: r["careers_url"] || null, city, cities: city ? [city] : [], industry: r["industry"] || null, tier: Number(r["tier"]) || 2, source_type: "auto" };
      }), { onConflict: "slug" });
      if (error) throw error;
      return valid.length;
    },
    onSuccess: (n) => { toast.success(`Imported ${n} companies`); setText(""); onDone(); onClose(); },
    onError: (e) => toast.error((e as Error).message),
  });
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Import companies from CSV</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">Columns: name, org_number, careers_url, city, industry, tier. Existing companies with the same name are updated.</p>
        <Input type="file" accept=".csv,text/csv" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setText(await f.text()); }} />
        <Textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder={"name,org_number,careers_url,city,industry,tier\nCombitech,556218-6790,https://www.combitech.com/career,Linköping,Consulting,3"} />
        {rows.length > 0 && <p className="text-sm">{rows.filter((r) => r["name"]).length} companies ready to import.</p>}
        <Button onClick={() => imp.mutate()} disabled={!rows.length || imp.isPending}>Import</Button>
      </DialogContent>
    </Dialog>
  );
}
