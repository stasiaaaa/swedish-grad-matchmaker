import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { TimeAgo } from "@/components/app/TimeAgo";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, MapPin, Clock, CalendarClock, Building2 } from "lucide-react";
import { SaveButton } from "@/components/app/SaveButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CompanyLogo } from "@/components/app/CompanyLogo";
import { jobQuery } from "@/lib/queries";
import { lookingForLabel, workModeLabel, daysUntil } from "@/lib/domain";

export const Route = createFileRoute("/jobs/$id")({
  loader: async ({ context, params }) => {
    const job = await context.queryClient.ensureQueryData(jobQuery(params.id));
    if (!job) throw notFound();
    return { title: job.title, company: job.company?.name ?? "", summary: job.summary ?? "" };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} at ${loaderData.company} — LaunchPad` },
          { name: "description", content: loaderData.summary.slice(0, 155) },
          { property: "og:title", content: `${loaderData.title} at ${loaderData.company}` },
          { property: "og:description", content: loaderData.summary.slice(0, 155) },
          { property: "og:type", content: "article" },
          { name: "twitter:card", content: "summary" },
        ]
      : [{ title: "Job unavailable — LaunchPad" }, { name: "robots", content: "noindex" }],
  }),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">This job doesn't exist</h1>
      <Link to="/jobs" className="mt-4 inline-block text-primary">Back to jobs</Link>
    </div>
  ),
  errorComponent: ({ error }) => <div className="mx-auto max-w-3xl px-4 py-16 text-destructive">Could not load this job: {(error as Error).message}</div>,
  component: JobDetail,
});

function JobDetail() {
  const { id } = Route.useParams();
  const { data: job } = useSuspenseQuery(jobQuery(id));
  if (!job) return null;
  const left = daysUntil(job.deadline);
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <Link to="/jobs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />All jobs</Link>
      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_320px]">
        <article className="rounded-2xl border border-border bg-card p-6 shadow-card md:p-8">
          <div className="flex items-start gap-4">
            <CompanyLogo name={job.company?.name ?? "?"} className="size-14 text-base" />
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge>{lookingForLabel[job.looking_for]}</Badge>
                <Badge variant="secondary">{job.role_type}</Badge>
                {job.status === "closed" && <Badge variant="outline">No longer open</Badge>}
              </div>
              <h1 className="mt-2 text-2xl font-extrabold md:text-3xl">{job.title}</h1>
              {job.company && (
                <Link to="/companies/$slug" params={{ slug: job.company.slug }} className="font-medium text-primary hover:underline">{job.company.name}</Link>
              )}
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><MapPin className="size-4" />{job.location_label} · {workModeLabel[job.work_mode]}</span>
            <span className="flex items-center gap-1.5"><Clock className="size-4" />Posted <TimeAgo iso={job.posted_at} /></span>
            {job.status === "open" && left !== null && left >= 0 && <span className="flex items-center gap-1.5"><CalendarClock className="size-4" />Apply by {job.deadline} ({left} days left)</span>}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {job.status === "closed" && (
              <p className="w-full rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">{job.source === "seed" ? "This was a sample listing and has been removed now that real jobs are collected." : "This listing has closed — it no longer appears on the company's site."}</p>
            )}
            {job.status === "open" && job.source_url && (
              <Button asChild size="lg"><a href={job.source_url} target="_blank" rel="noopener noreferrer">Apply on company site <ExternalLink className="size-4" /></a></Button>
            )}
            <SaveButton jobId={job.id} />
          </div>
          <h2 className="mt-8 text-lg font-bold">Summary</h2>
          <p className="mt-2 leading-relaxed text-foreground/85">{job.summary}</p>
          {job.key_requirements.length > 0 && (
            <>
              <h2 className="mt-6 text-lg font-bold">Key requirements</h2>
              <ul className="mt-2 space-y-1.5">
                {job.key_requirements.map((r) => <li key={r} className="flex gap-2"><span className="text-primary">•</span>{r}</li>)}
              </ul>
            </>
          )}
          <h2 className="mt-6 text-lg font-bold">Required skills</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {job.required_skills.map((s) => <span key={s} className="rounded-full bg-muted px-3 py-1 text-sm font-medium">{s}</span>)}
          </div>
          {job.nice_skills.length > 0 && (
            <>
              <h3 className="mt-4 text-sm font-semibold text-muted-foreground">Nice to have</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {job.nice_skills.map((s) => <span key={s} className="rounded-full border border-border px-3 py-1 text-sm">{s}</span>)}
              </div>
            </>
          )}
          <p className="mt-8 text-xs text-muted-foreground">Collected from the company's public listing. Always check the original posting for full details.</p>
        </article>
        {job.company && (
          <aside className="h-fit rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center gap-2 text-sm font-semibold"><Building2 className="size-4 text-primary" />About the company</div>
            <p className="mt-3 font-display text-lg font-bold">{job.company.name}</p>
            <p className="text-sm text-muted-foreground">{job.company.industry}</p>
            <p className="mt-3 text-sm">{job.company.description}</p>
            <Button asChild variant="secondary" className="mt-4 w-full">
              <Link to="/companies/$slug" params={{ slug: job.company.slug }}>View company</Link>
            </Button>
          </aside>
        )}
      </div>
    </main>
  );
}
