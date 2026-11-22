import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { TimeAgo } from "@/components/app/TimeAgo";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ExternalLink, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompanyLogo } from "@/components/app/CompanyLogo";
import { companyQuery } from "@/lib/queries";
import { cityLabel, lookingForLabel } from "@/lib/domain";

export const Route = createFileRoute("/companies/$slug")({
  loader: async ({ context, params }) => {
    const c = await context.queryClient.ensureQueryData(companyQuery(params.slug));
    if (!c) throw notFound();
    return { name: c.name, description: c.description ?? "" };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.name} — jobs and thesis projects | LaunchPad` },
          { name: "description", content: loaderData.description },
          { property: "og:title", content: `${loaderData.name} on LaunchPad` },
          { property: "og:description", content: loaderData.description },
          { property: "og:type", content: "profile" },
          { name: "twitter:card", content: "summary" },
        ]
      : [{ title: "Company unavailable — LaunchPad" }, { name: "robots", content: "noindex" }],
  }),
  notFoundComponent: () => <div className="mx-auto max-w-3xl px-4 py-16 text-center"><h1 className="text-2xl font-bold">Company not found</h1></div>,
  errorComponent: ({ error }) => <div className="mx-auto max-w-3xl px-4 py-16 text-destructive">{(error as Error).message}</div>,
  component: CompanyPage,
});

function CompanyPage() {
  const { slug } = Route.useParams();
  const { data: c } = useSuspenseQuery(companyQuery(slug));
  if (!c) return null;
  const open = c.jobs.filter((j) => j.status === "open");
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card md:p-8">
        <div className="flex items-center gap-4">
          <CompanyLogo name={c.name} className="size-16 text-lg" />
          <div>
            <h1 className="text-3xl font-extrabold">{c.name}</h1>
            <p className="text-muted-foreground">{c.industry} · {c.cities.map((x) => cityLabel[x]).join(", ")}</p>
          </div>
        </div>
        <p className="mt-5">{c.description}</p>
        {c.is_watched && (
          <div className="mt-5 rounded-xl bg-primary-soft p-4 text-sm">
            <p className="flex items-center gap-2 font-semibold"><Eye className="size-4" />We're watching this company</p>
            {c.hiring_period && <p className="mt-1">{c.hiring_period}.</p>}
            {c.watch_note && <p className="mt-1 text-muted-foreground">{c.watch_note}</p>}
            {c.last_posting_at && <p className="mt-1 text-muted-foreground">Last known posting: <TimeAgo iso={c.last_posting_at} /></p>}
          </div>
        )}
        {c.careers_url && (
          <Button asChild variant="outline" className="mt-5"><a href={c.careers_url} target="_blank" rel="noopener noreferrer">Careers page <ExternalLink className="size-4" /></a></Button>
        )}
      </div>
      <h2 className="mt-8 text-xl font-bold">Open roles ({open.length})</h2>
      {open.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">No open roles right now.</p>
      ) : (
        <div className="mt-3 divide-y divide-border rounded-2xl border border-border bg-card">
          {open.map((j) => (
            <Link key={j.id} to="/jobs/$id" params={{ id: j.id }} className="flex items-center justify-between gap-3 p-4 hover:bg-muted/50">
              <div>
                <p className="font-semibold">{j.title}</p>
                <p className="text-sm text-muted-foreground">{lookingForLabel[j.looking_for]} · {j.location_label}</p>
              </div>
              <span className="text-xs text-muted-foreground"><TimeAgo iso={j.posted_at} /></span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
