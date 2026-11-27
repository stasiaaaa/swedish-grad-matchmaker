import { SampleUploads } from "@/components/app/SampleUploads";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { LOOKING_FOR, PROGRAMMES } from "@/lib/domain";
import { COURSE_BY_CODE } from "@/lib/demo/catalog";
import { skillSources, sortFeed } from "@/lib/demo/match";
import { demo, currentAccount, stages, type Stage, useDemo } from "@/lib/demo/store";
import { useListings } from "@/lib/demo/listings";
import { MatchBadge } from "@/components/app/DemoMatch";

export const Route = createFileRoute("/demo/student")({
  validateSearch: z.object({ view: z.enum(["profile", "tracked"]).optional() }),
  component: StudentView,
});
function StudentView() {
  const account = currentAccount(useDemo());
  const jobs = useListings();
  const { view } = Route.useSearch();
  const [query, setQuery] = useState("");
  if (account?.role !== "student") return null;
  const me = account.profile;
  if (view === "profile")
    return (
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-8">
        <h1 className="text-3xl font-bold">Edit profile</h1>
        <p>{me.name}</p>
        <details className="space-y-3 rounded-xl border p-4">
          <summary className="cursor-pointer font-semibold">Education</summary>
          <label>
            Programme
            <select
              className="block w-full rounded border p-2"
              value={me.programme}
              onChange={(e) => demo.profile({ programme: e.target.value })}
            >
              {PROGRAMMES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <label>
            Year
            <select
              className="ml-2 rounded border p-1"
              value={me.year}
              onChange={(e) => demo.profile({ year: Number(e.target.value) })}
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
        </details>
        <details className="space-y-3 rounded-xl border p-4">
          <summary className="cursor-pointer font-semibold">CV and Ladok</summary>
          <SampleUploads
            onCv={() => demo.upload("cvSkills")}
            onLadok={() => demo.upload("courses")}
          />
          <h2 className="font-semibold">Skills and sources</h2>
          <ul>
            {skillSources(me).map((s) => (
              <li key={s.skill}>
                {s.skill} · {s.sources.join(", ")}
              </li>
            ))}
          </ul>
          <h2 className="font-semibold">Completed courses</h2>
          <ul>
            {me.courses.map((code) => (
              <li key={code}>
                <a href={COURSE_BY_CODE[code]?.url}>
                  {code} {COURSE_BY_CODE[code]?.name}
                </a>
              </li>
            ))}
          </ul>
        </details>
        <details className="space-y-2 rounded-xl border p-4">
          <summary className="cursor-pointer font-semibold">Job preferences</summary>
          {LOOKING_FOR.map((p) => (
            <label className="flex gap-2" key={p.key}>
              <input
                type="checkbox"
                checked={account.preferences.includes(p.key)}
                onChange={(e) =>
                  demo.preferences(
                    e.target.checked
                      ? [...account.preferences, p.key]
                      : account.preferences.filter((k) => k !== p.key),
                  )
                }
              />
              {p.label}
            </label>
          ))}
        </details>
      </main>
    );
  if (view === "tracked")
    return (
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-8">
        <h1 className="text-3xl font-bold">My jobs</h1>
        <p>Your personal application tracker. Update each stage as your application progresses.</p>
        {stages.map((stage) => (
          <section key={stage}>
            <h2 className="font-semibold">{stage}</h2>
            {account.tracked
              .filter((x) => x.stage === stage)
              .map(({ job }) => (
                <div
                  className="my-2 flex items-center justify-between rounded-xl border p-3"
                  key={job.id}
                >
                  <Link to="/demo/jobb/$id" params={{ id: job.id }}>
                    {job.title}
                  </Link>
                  <select
                    aria-label={"Stage for " + job.title}
                    value={stage}
                    onChange={(e) => demo.track(job, e.target.value as Stage)}
                  >
                    {stages.slice(stages.indexOf(stage)).map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              ))}
          </section>
        ))}
      </main>
    );
  const feed = sortFeed(jobs, me).filter(({ job }) =>
    [job.title, job.company, job.city, ...job.requirements]
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <main className="mx-auto max-w-4xl space-y-4 px-4 py-8">
      <h1 className="text-3xl font-bold">{me.name}</h1>
      <Input
        type="search"
        aria-label="Search jobs"
        placeholder="Search by title, company or skill"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <section>
        <h2 className="text-xl font-bold">Jobs for you</h2>
        <div className="mt-3 space-y-3">
          {feed.map(({ job, m, boosted }) => (
            <Link
              key={job.id}
              to="/demo/jobb/$id"
              params={{ id: job.id }}
              className={`block rounded-2xl border bg-card p-4 hover:shadow-card ${boosted ? "border-2 border-highlight" : "border-border"}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold">{job.title}</p>
                {boosted && (
                  <span className="rounded bg-highlight px-2 py-0.5 text-xs font-bold text-foreground">
                    Boosted
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {job.company} · {job.city}
              </p>
              <div className="mt-2">
                <MatchBadge m={m} />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
