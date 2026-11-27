import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { COURSE_BY_CODE } from "@/lib/demo/catalog";
import { matchJob, skillSources, type DemoStudent } from "@/lib/demo/match";
import { currentAccount, useDemo } from "@/lib/demo/store";
import { matchLabel } from "@/components/app/DemoMatch";

export const Route = createFileRoute("/demo/studenter")({
  validateSearch: z.object({ job: z.string().optional() }),
  component: Students,
});

function Students() {
  const { job: jobId } = Route.useSearch();
  const st = useDemo();
  const job = st.jobs.find((j) => j.id === jobId && j.companyId === currentAccount(st)?.id);
  const [sel, setSel] = useState<DemoStudent | null>(null);
  const [query, setQuery] = useState("");
  const rows = st.students
    .filter((s) =>
      [s.name, s.programme, ...skillSources(s).map((k) => k.skill)]
        .join(" ")
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
    )
    .map((s) => ({ s, m: job ? matchJob(job, s) : null }));
  if (job) rows.sort((a, b) => b.m!.pct - a.m!.pct);
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <Link to="/demo/foretag" className="text-sm text-primary">
        ← Company dashboard
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold">
        Find students ({rows.length}){job && ` · matches for ${job.title}`}
      </h1>
      <label className="mt-4 block">
        Search by name, programme or skill
        <input
          className="mt-1 block w-full rounded-lg border p-2"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <ul className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card">
        {rows.map(({ s, m }) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => setSel(s)}
              className="flex w-full flex-wrap items-center justify-between gap-2 px-4 py-3 text-left hover:bg-secondary"
            >
              <span>
                <span className="font-semibold">{s.name}</span>
                <span className="block text-sm text-muted-foreground">
                  {s.programme} · Year {s.year}
                </span>
              </span>
              {m && <span className="text-sm font-semibold tabular-nums">{matchLabel(m)}</span>}
            </button>
          </li>
        ))}
      </ul>
      <Dialog open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <DialogContent>
          {sel && (
            <>
              <DialogHeader>
                <DialogTitle>{sel.name}</DialogTitle>
              </DialogHeader>
              <p>Fictional contact · {sel.id}@students.example.org</p>
              <p className="text-sm text-muted-foreground">
                {sel.programme} · Linköpings universitet · Year {sel.year}
              </p>
              <p className="mt-2 font-semibold">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {skillSources(sel).map((k) => (
                  <span key={k.skill} className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                    {k.skill} · {k.sources.join(", ")}
                  </span>
                ))}
              </div>
              <p className="mt-2 font-semibold">Completed courses</p>
              <ul className="text-sm">
                {sel.courses.map((c) => (
                  <li key={c}>
                    {c} {COURSE_BY_CODE[c]?.name}
                  </li>
                ))}
              </ul>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
