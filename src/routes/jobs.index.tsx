import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { TimeAgo } from "@/components/app/TimeAgo";
import { useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Search, X, List, Map as MapIcon, Wifi, LocateFixed } from "lucide-react";
import { useMemo, useState, useEffect, lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { Switch } from "@/components/ui/switch";
import { CITY_VIEWS, type Bounds, type MapCompany, type MapJob } from "@/lib/map-data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { JobCard } from "@/components/app/JobCard";
import { CITIES, LOOKING_FOR } from "@/lib/domain";
import { filterJobs, jobsQuery, watchedCompaniesQuery } from "@/lib/queries";

const JobsMap = lazy(() => import("@/components/app/JobsMap"));

const searchSchema = z.object({
  q: z.string().optional(),
  lf: z.string().optional(),
  role: z.string().optional(),
  city: z.string().optional(),
  mode: z.string().optional(),
  company: z.string().optional(),
  skill: z.string().optional(),
  sort: z.enum(["newest", "match"]).optional(),
  view: z.enum(["list", "map"]).optional(),
  watched: z.boolean().optional(),
});

export const Route = createFileRoute("/jobs/")({
  validateSearch: searchSchema,
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(jobsQuery()), context.queryClient.ensureQueryData(watchedCompaniesQuery())]),
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

  const { data: watched } = useSuspenseQuery(watchedCompaniesQuery());
  const results = useMemo(() => filterJobs(jobs, search), [jobs, search]);
  const isMap = search.view === "map";
  const [viewBounds, setViewBounds] = useState<Bounds | null>(null);
  const [area, setArea] = useState<Bounds | null>(null);
  useEffect(() => setArea(null), [search.city, isMap]);
  const inArea = (lat: number | null, lng: number | null) =>
    !area || (lat != null && lng != null && lat <= area.n && lat >= area.s && lng <= area.e && lng >= area.w);
  const onsite = results.filter((j) => j.city !== "remote" && j.lat != null);
  const remote = results.filter((j) => j.city === "remote" || j.lat == null);
  const listed = isMap ? onsite.filter((j) => inArea(j.lat, j.lng)) : results;
  const mapJobs: MapJob[] = useMemo(() => onsite.map((j) => ({ id: j.id, title: j.title, company: j.company?.name ?? "", role: j.role_type, lat: j.lat!, lng: j.lng!, label: j.location_label })), [onsite]);
  const mapCompanies: MapCompany[] = useMemo(() => watched.filter((c) => c.lat != null).map((c) => ({ slug: c.slug, name: c.name, industry: c.industry ?? "", lat: c.lat!, lng: c.lng!, roles: c.typical_roles })), [watched]);
  const lastUpdated = jobs.reduce((m, j) => (j.last_seen_at > m ? j.last_seen_at : m), "");
  const active = Object.entries(search).filter(([k, v]) => v && !["sort", "view", "watched"].includes(k)).length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Find jobs</h1>
          <p className="text-sm text-muted-foreground">Last updated: <TimeAgo iso={lastUpdated} /></p>
        </div>
        <div className="flex rounded-xl border border-border bg-card p-1">
          <button type="button" onClick={() => set({ view: undefined })} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${!isMap ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}><List className="size-4" />List</button>
          <button type="button" onClick={() => set({ view: "map" })} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${isMap ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}><MapIcon className="size-4" />Map</button>
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

      {isMap && (
        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-2">
            {Object.entries(CITY_VIEWS).map(([k, v]) => (
              <Button key={k} size="sm" variant={search.city === k ? "default" : "outline"} onClick={() => set({ city: search.city === k ? undefined : k })}>
                <LocateFixed className="size-3.5" />{v.label}
              </Button>
            ))}
            <label className="ml-auto flex items-center gap-2 text-sm font-medium">
              <Switch checked={!!search.watched} onCheckedChange={(v) => set({ watched: v || undefined })} />
              Show watched companies
            </label>
          </div>
          <div className="relative mt-3 h-[55vh] min-h-[360px] overflow-hidden rounded-2xl border border-border shadow-card">
            <ClientOnly fallback={<div className="h-full w-full animate-pulse bg-muted" />}>
              <Suspense fallback={<div className="h-full w-full animate-pulse bg-muted" />}>
                <JobsMap jobs={mapJobs} companies={mapCompanies} showWatched={!!search.watched} focusCity={search.city && CITY_VIEWS[search.city] ? search.city : null} onMove={setViewBounds} />
              </Suspense>
            </ClientOnly>
            {viewBounds && (
              <div className="pointer-events-none absolute inset-x-0 top-3 z-[500] flex justify-center">
                <Button size="sm" className="pointer-events-auto shadow-lift" onClick={() => setArea(viewBounds)}>
                  <Search className="size-3.5" />Search this area
                </Button>
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Filled pins are open jobs, coloured by role type. Hollow pins are watched companies with no open roles.</p>
        </div>
      )}

      <div className="mt-5 flex items-center justify-between text-sm">
        <span className="font-medium">{listed.length} {listed.length === 1 ? "job" : "jobs"}{area ? " in this area" : ""}</span>
        <div className="flex gap-3">
          {area && <button type="button" onClick={() => setArea(null)} className="text-muted-foreground hover:text-foreground">Show whole map</button>}
          {active > 0 && (
            <Link to="/jobs" search={{ view: search.view }} className="flex items-center gap-1 text-muted-foreground hover:text-foreground"><X className="size-4" />Clear filters</Link>
          )}
        </div>
      </div>

      {listed.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <p className="font-display text-lg font-bold">No jobs match these filters</p>
          <p className="mt-1 text-sm text-muted-foreground">Try removing a filter or searching for something broader.</p>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {listed.map((j) => <JobCard key={j.id} job={j} />)}
        </div>
      )}

      {isMap && remote.length > 0 && (
        <section className="mt-10">
          <h2 className="flex items-center gap-2 text-xl font-bold"><Wifi className="size-5 text-primary" />Remote ({remote.length})</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {remote.map((j) => <JobCard key={j.id} job={j} />)}
          </div>
        </section>
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

