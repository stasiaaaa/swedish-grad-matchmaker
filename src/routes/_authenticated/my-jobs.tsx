import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ExternalLink, Trash2, CheckCircle2, CalendarClock, StickyNote, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CompanyLogo } from "@/components/app/CompanyLogo";
import { JobCard } from "@/components/app/JobCard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { followsQuery, myProfileQuery, savedJobsQuery } from "@/lib/account";
import { jobsQuery } from "@/lib/queries";
import { matchScore } from "@/lib/match";
import { cityLabel, daysUntil, workModeLabel } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/my-jobs")({
  head: () => ({ meta: [{ title: "My jobs — LaunchPad" }, { name: "robots", content: "noindex" }] }),
  component: MyJobs,
});

const STATUSES = [["saved", "Saved"], ["applied", "Applied"], ["interview", "Interview"], ["offer", "Offer"], ["rejected", "Rejected"]] as const;

function MyJobs() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: saved = [], isLoading } = useQuery(savedJobsQuery(user?.id));
  const { data: follows = [] } = useQuery(followsQuery(user?.id));
  const { data: me } = useQuery(myProfileQuery(user?.id));
  const { data: allJobs = [] } = useQuery(jobsQuery());
  const [sort, setSort] = useState("date");
  const [statusFilter, setStatusFilter] = useState("all");

  const profile = useMemo(() => ({
    skills: me?.skills.map((s) => s.skill) ?? [],
    level: me?.student?.study_level ?? null,
    cities: me?.student?.cities ?? [],
  }), [me]);

  const rows = saved.filter((s) => s.job).map((s) => ({ ...s, score: matchScore(s.job!, profile).score, closed: s.job!.status === "closed" }));
  const sorted = (list: typeof rows) => [...list].sort((a, b) =>
    sort === "match" ? b.score - a.score
      : sort === "deadline" ? (a.job!.deadline ?? "9999").localeCompare(b.job!.deadline ?? "9999")
      : b.saved_at.localeCompare(a.saved_at));
  const filt = (list: typeof rows) => statusFilter === "all" ? list : list.filter((r) => r.status === statusFilter);

  const open = rows.filter((r) => !r.closed);
  const tabSaved = open.filter((r) => r.status === "saved");
  const tabApplied = open.filter((r) => r.status !== "saved");
  const tabClosed = rows.filter((r) => r.closed);
  const closingSoon = open.filter((r) => { const d = daysUntil(r.job!.deadline); return d !== null && d >= 0 && d <= 7; });

  const savedIds = new Set(saved.map((s) => s.job_id));
  const lf = me?.student?.looking_for ?? [];
  const recommended = allJobs
    .filter((j) => !savedIds.has(j.id) && (lf.length === 0 || lf.includes(j.looking_for)))
    .map((j) => ({ j, s: matchScore(j, profile).score }))
    .sort((a, b) => b.s - a.s).slice(0, 4);

  const invalidate = () => qc.invalidateQueries({ queryKey: savedJobsQuery(user?.id).queryKey });
  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: { status?: string; notes?: string } }) => {
      const { error } = await supabase.from("saved_jobs").update(patch as { status?: "saved" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e) => toast.error((e as Error).message),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("saved_jobs").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Removed"); invalidate(); },
  });
  const unfollow = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("company_follows").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: followsQuery(user?.id).queryKey }),
  });

  const List = ({ list }: { list: typeof rows }) => {
    const l = sorted(filt(list));
    if (isLoading) return <p className="py-8 text-muted-foreground">Loading…</p>;
    if (l.length === 0) return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <p className="font-display text-lg font-bold">Nothing here yet</p>
        <p className="mt-1 text-sm text-muted-foreground">Tap the bookmark on any job to save it here.</p>
        <Button asChild className="mt-4"><Link to="/jobs">Find jobs</Link></Button>
      </div>
    );
    return (
      <div className="divide-y divide-border rounded-2xl border border-border bg-card">
        {l.map((r) => {
          const j = r.job!;
          const left = daysUntil(j.deadline);
          return (
            <div key={r.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
              <div className="flex min-w-0 flex-1 gap-3">
                <CompanyLogo name={j.company?.name ?? "?"} />
                <div className="min-w-0">
                  <Link to="/jobs/$id" params={{ id: j.id }} className="font-semibold hover:text-primary">{j.title}</Link>
                  <p className="text-sm text-muted-foreground">{j.company?.name} · {j.location_label} · {workModeLabel[j.work_mode]}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {r.closed && <Badge variant="outline" className="text-muted-foreground">No longer open</Badge>}
                    <span className="rounded-full bg-success-soft px-2 py-0.5 font-semibold text-success">{r.score}% match</span>
                    <span>Saved {new Date(r.saved_at).toLocaleDateString("sv-SE")}</span>
                    {j.status === "open" && left !== null && left >= 0 && <span className={left <= 7 ? "font-semibold text-destructive" : ""}>Deadline {j.deadline}</span>}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={r.status} onValueChange={(v) => update.mutate({ id: r.id, patch: { status: v } })}>
                  <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
                </Select>
                <NotesButton notes={r.notes ?? ""} onSave={(notes) => update.mutate({ id: r.id, patch: { notes } })} />
                {r.status === "saved" && (
                  <Button size="sm" variant="outline" onClick={() => update.mutate({ id: r.id, patch: { status: "applied" } })}><CheckCircle2 className="size-4" />Mark applied</Button>
                )}
                <Button asChild size="icon" variant="ghost" aria-label="Open"><Link to="/jobs/$id" params={{ id: j.id }}><ExternalLink className="size-4" /></Link></Button>
                <Button size="icon" variant="ghost" aria-label="Remove" onClick={() => remove.mutate(r.id)}><Trash2 className="size-4" /></Button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">My jobs</h1>
      {me && !me.student?.onboarded && me.profile?.account_type === "student" && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-primary-soft p-4">
          <p className="text-sm font-medium">Finish your profile to get match scores and recommendations.</p>
          <Button asChild size="sm"><Link to="/onboarding">Complete profile</Link></Button>
        </div>
      )}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <Stat n={open.length} label="saved" />
        <Stat n={tabApplied.length} label="applied" />
        <Stat n={closingSoon.length} label="closing this week" warn={closingSoon.length > 0} />
      </div>
      {closingSoon.length > 0 && (
        <div className="mt-4 rounded-2xl border border-destructive/30 bg-card p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-destructive"><CalendarClock className="size-4" />Closing soon</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {closingSoon.map((r) => (
              <Link key={r.id} to="/jobs/$id" params={{ id: r.job!.id }} className="rounded-full border border-border px-3 py-1 text-sm hover:border-primary">
                {r.job!.title} · {daysUntil(r.job!.deadline)} days
              </Link>
            ))}
          </div>
        </div>
      )}

      {recommended.length > 0 && (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-xl font-bold"><Sparkles className="size-5 text-primary" />Recommended for you</h2>
          <div className="mt-3 grid gap-4 lg:grid-cols-2">{recommended.map(({ j }) => <JobCard key={j.id} job={j} />)}</div>
        </section>
      )}

      <Tabs defaultValue="saved" className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="saved">Saved ({tabSaved.length})</TabsTrigger>
            <TabsTrigger value="applied">Applied ({tabApplied.length})</TabsTrigger>
            <TabsTrigger value="watching">Watching ({follows.length})</TabsTrigger>
            <TabsTrigger value="closed">Closed ({tabClosed.length})</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All statuses</SelectItem>{STATUSES.map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="date">Date saved</SelectItem><SelectItem value="deadline">Deadline</SelectItem><SelectItem value="match">Best match</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
        <TabsContent value="saved" className="mt-4"><List list={tabSaved} /></TabsContent>
        <TabsContent value="applied" className="mt-4"><List list={tabApplied} /></TabsContent>
        <TabsContent value="closed" className="mt-4"><List list={tabClosed} /></TabsContent>
        <TabsContent value="watching" className="mt-4">
          {follows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
              <p className="font-display text-lg font-bold">You're not watching any companies</p>
              <Button asChild className="mt-4"><Link to="/watching">Browse watched companies</Link></Button>
            </div>
          ) : (
            <div className="divide-y divide-border rounded-2xl border border-border bg-card">
              {follows.map((f) => f.company && (
                <div key={f.id} className="flex items-center gap-3 p-4">
                  <CompanyLogo name={f.company.name} />
                  <div className="flex-1">
                    <Link to="/companies/$slug" params={{ slug: f.company.slug }} className="font-semibold hover:text-primary">{f.company.name}</Link>
                    <p className="text-sm text-muted-foreground">{f.company.industry} · {f.company.cities.map((c) => cityLabel[c]).join(", ")}{f.company.hiring_period ? ` · ${f.company.hiring_period}` : ""}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => unfollow.mutate(f.id)}>Stop watching</Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}

function Stat({ n, label, warn }: { n: number; label: string; warn?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <p className={`font-display text-3xl font-extrabold ${warn ? "text-destructive" : "text-primary"}`}>{n}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function NotesButton({ notes, onSave }: { notes: string; onSave: (n: string) => void }) {
  const [v, setV] = useState(notes);
  return (
    <Popover onOpenChange={(o) => o && setV(notes)}>
      <PopoverTrigger asChild>
        <Button size="icon" variant="ghost" aria-label="Notes"><StickyNote className={`size-4 ${notes ? "text-primary" : ""}`} /></Button>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <p className="mb-2 text-sm font-semibold">Private notes</p>
        <Textarea value={v} onChange={(e) => setV(e.target.value)} placeholder="Contact person, interview date…" />
        <Button size="sm" className="mt-2 w-full" onClick={() => { onSave(v); toast.success("Notes saved"); }}>Save notes</Button>
      </PopoverContent>
    </Popover>
  );
}
