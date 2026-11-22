import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Search, X } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { JobCard } from "@/components/app/JobCard";
import { CITIES, LOOKING_FOR, timeAgo } from "@/lib/domain";
import { filterJobs, jobsQuery } from "@/lib/queries";

const searchSchema = z.object({
  q: z.string().optional(),
  lf: z.string().optional(),
  role: z.string().optional(),
  city: z.string().optional(),
  mode: z.string().optional(),
  company: z.string().optional(),
  skill: z.string().optional(),
  sort: z.enum(["newest", "match"]).optional(),
});

export const Route = createFileRoute("/jobs/")({
  validateSearch: searchSchema,
  loader: ({ context }) => context.queryClient.ensureQueryData(jobsQuery()),
  head: () => ({
    meta: [
      { title: "Find jobs — LaunchPad" },
      { name: "description", content: "Filter thesis projects, internships, graduate programmes and jobs by city, role type and skills." },
      { property: "og:title", content: "Find jobs — LaunchPad" },
      { property: "og:description", content: "Engineering jobs and thesis projects in Linköping, Stockholm and Gothenburg." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  pendingComponent: () => <div className="mx-auto max-w-6xl px-4 py-10 text-muted-foreground">Loading jobs…</div>,
  errorComponent: ({ error }) => <div className="mx-auto max-w-6xl px-4 py-10 text-destructive">Could not load jobs: {(error as Error).message}</div>,
  component: JobSearch,
});


function JobSearch() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/jobs/" });
  const { data: jobs } = useSuspenseQuery(jobsQuery());
  const [q, setQ] = useState(search.q ?? "");
  useEffect(() => setQ(search.q ?? ""), [search.q]);

  const set = (patch: Partial<typeof search>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });

  const results = useMemo(() => filterJobs(jobs, search), [jobs, search]);
  const lastUpdated = jobs.reduce((m, j) => (j.last_seen_at > m ? j.last_seen_at : m), "");
  const active = Object.entries(search).filter(([k, v]) => v && k !== "sort").length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Find jobs</h1>
          <p className="text-sm text-muted-foreground">Last updated: {timeAgo(lastUpdated)}</p>
        </div>
      </div>

      <form className="mt-5 flex gap-2" onSubmit={(e) => { e.preventDefault(); set({ q: q || undefined }); }}>
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-input bg-card px-3">
          <Search className="size-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, company or skill" className="border-0 shadow-none focus-visible:ring-0" />
        </div>
        <Button type="submit">Search</Button>
      </form>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        <Chip active={!search.lf} onClick={() => set({ lf: undefined })}>All</Chip>
        {LOOKING_FOR.map((l) => (
          <Chip key={l.key} active={search.lf === l.key} onClick={() => set({ lf: search.lf === l.key ? undefined : l.key })}>{l.label}</Chip>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {CITIES.map((c) => (
          <Chip key={c.key} subtle active={search.city === c.key} onClick={() => set({ city: search.city === c.key ? undefined : c.key })}>{c.label}</Chip>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between text-sm">
        <span className="font-medium">{results.length} {results.length === 1 ? "job" : "jobs"}</span>
        {active > 0 && (
          <Link to="/jobs" search={{}} className="flex items-center gap-1 text-muted-foreground hover:text-foreground"><X className="size-4" />Clear filters</Link>
        )}
      </div>

      {results.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <p className="font-display text-lg font-bold">No jobs match these filters</p>
          <p className="mt-1 text-sm text-muted-foreground">Try removing a filter or searching for something broader.</p>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {results.map((j) => <JobCard key={j.id} job={j} />)}
        </div>
      )}
    </main>
  );
}

function Chip({ active, subtle, onClick, children }: { active: boolean; subtle?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
        active ? (subtle ? "border-primary bg-primary-soft text-accent-foreground" : "border-primary bg-primary text-primary-foreground") : "border-border bg-card hover:border-primary"
      }`}
    >
      {children}
    </button>
  );
}

