import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { COURSE_BY_CODE } from "@/lib/demo/catalog";
import { matchJob, skillSources, type DemoStudent } from "@/lib/demo/match";
import { useDemo } from "@/lib/demo/store";
import { matchLabel } from "@/components/app/DemoMatch";

export const Route = createFileRoute("/demo/studenter")({
  validateSearch: z.object({ job: z.string().optional() }),
  component: Students,
});

function Students() {
  const { job: jobId } = Route.useSearch();
  const st = useDemo();
  const job = st.jobs.find((j) => j.id === jobId);
  const [sel, setSel] = useState<DemoStudent | null>(null);
  const rows = st.students.map((s) => ({ s, m: job ? matchJob(job, s) : null }));
  if (job) rows.sort((a, b) => b.m!.pct - a.m!.pct);
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <Link to="/demo/foretag" className="text-sm text-primary">← Mina annonser</Link>
      <h1 className="mt-2 text-2xl font-extrabold">Studenter ({st.students.length}){job && ` · matchning för ${job.title}`}</h1>
      <ul className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card">
        {rows.map(({ s, m }) => (
          <li key={s.id}>
            <button type="button" onClick={() => setSel(s)} className="flex w-full flex-wrap items-center justify-between gap-2 px-4 py-3 text-left hover:bg-secondary">
              <span><span className="font-semibold">{s.name}</span><span className="block text-sm text-muted-foreground">{s.programme} · årskurs {s.year}</span></span>
              {m && <span className="text-sm font-semibold tabular-nums">{matchLabel(m)}</span>}
            </button>
          </li>
        ))}
      </ul>
      <Dialog open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <DialogContent>
          {sel && (<>
            <DialogHeader><DialogTitle>{sel.name}</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">{sel.programme} · Linköpings universitet · årskurs {sel.year}</p>
            <p className="mt-2 font-semibold">Kompetenser</p>
            <div className="flex flex-wrap gap-1.5">{skillSources(sel).map((k) => <span key={k.skill} className="rounded-full bg-secondary px-2 py-0.5 text-xs">{k.skill} · {k.sources.join(", ")}</span>)}</div>
            <p className="mt-2 font-semibold">Avklarade kurser</p>
            <ul className="text-sm">{sel.courses.map((c) => <li key={c}>{c} {COURSE_BY_CODE[c]?.name}</li>)}</ul>
          </>)}
        </DialogContent>
      </Dialog>
    </main>
  );
}
