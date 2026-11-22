import { createFileRoute, Link } from "@tanstack/react-router";
import { TimeAgo } from "@/components/app/TimeAgo";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, ExternalLink, CalendarClock, Bell } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CompanyLogo } from "@/components/app/CompanyLogo";
import { watchedCompaniesQuery } from "@/lib/queries";
import { CITIES, cityLabel } from "@/lib/domain";

export const Route = createFileRoute("/watching")({
  loader: ({ context }) => context.queryClient.ensureQueryData(watchedCompaniesQuery()),
  head: () => ({
    meta: [
      { title: "Companies we're watching — LaunchPad" },
      { name: "description", content: "Engineering employers in Linköping, Stockholm and Gothenburg with no open roles right now. Get notified when they post." },
      { property: "og:title", content: "Companies we're watching — LaunchPad" },
      { property: "og:description", content: "Get notified the moment these employers open thesis, internship or graduate roles." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  pendingComponent: () => <div className="mx-auto max-w-6xl px-4 py-10 text-muted-foreground">Loading companies…</div>,
  errorComponent: ({ error }) => <div className="mx-auto max-w-6xl px-4 py-10 text-destructive">{(error as Error).message}</div>,
  component: Watching,
});

function Watching() {
  const { data } = useSuspenseQuery(watchedCompaniesQuery());
  const [q, setQ] = useState("");
  const [city, setCity] = useState<string | null>(null);
  const list = useMemo(() => {
    const s = q.toLowerCase();
    return data.filter((c) =>
      (!city || c.cities.includes(city)) &&
      (!s || [c.name, c.industry, ...c.typical_roles].join(" ").toLowerCase().includes(s)));
  }, [data, q, city]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Companies we're watching</h1>
      <p className="mt-1 max-w-2xl text-muted-foreground">These employers have no open roles right now. Hit “Notify me” and we'll email you the moment they post.</p>
      <div className="mt-5 flex items-center gap-2 rounded-xl border border-input bg-card px-3">
        <Search className="size-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search company, industry or role" className="border-0 shadow-none focus-visible:ring-0" />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {CITIES.slice(0, 3).map((c) => (
          <button key={c.key} type="button" onClick={() => setCity(city === c.key ? null : c.key)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${city === c.key ? "border-primary bg-primary-soft text-accent-foreground" : "border-border bg-card hover:border-primary"}`}>
            {c.label}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">No companies match.</div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => (
            <div key={c.id} className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center gap-3">
                <CompanyLogo name={c.name} />
                <div>
                  <Link to="/companies/$slug" params={{ slug: c.slug }} className="font-display text-lg font-bold hover:text-primary">{c.name}</Link>
                  <p className="text-sm text-muted-foreground">{c.industry} · {c.cities.map((x) => cityLabel[x]).join(", ")}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {c.typical_roles.map((r) => <span key={r} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{r}</span>)}
              </div>
              {c.hiring_period && <p className="mt-3 flex items-center gap-1.5 text-sm font-medium"><CalendarClock className="size-4 text-primary" />{c.hiring_period}</p>}
              {c.watch_note && <p className="mt-2 text-sm text-muted-foreground">{c.watch_note}</p>}
              {c.last_posting_at && <p className="mt-2 text-xs text-muted-foreground">Last known posting: <TimeAgo iso={c.last_posting_at} /></p>}
              <div className="mt-auto flex gap-2 pt-4">
                <Button className="flex-1" onClick={() => toast("Notifications are coming soon", { description: "You'll be able to subscribe with just your email." })}>
                  <Bell className="size-4" />Notify me
                </Button>
                {c.careers_url && (
                  <Button asChild variant="outline" size="icon" aria-label="Careers page">
                    <a href={c.careers_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-4" /></a>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
