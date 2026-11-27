import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { FileText, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COURSE_BY_CODE } from "@/lib/demo/catalog";
import { skillSources, sortFeed } from "@/lib/demo/match";
import { demo, useDemo } from "@/lib/demo/store";
import { MatchBadge } from "@/components/app/DemoMatch";

export const Route = createFileRoute("/demo/student")({ component: StudentView });

function StudentView() {
  const st = useDemo();
  const me = st.students[0]!;
  const [cvMsg, setCvMsg] = useState<string | null>(null);
  const [ladokMsg, setLadokMsg] = useState<string | null>(null);
  const feed = sortFeed(st.jobs, me);
  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_1.4fr]">
      <section className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h1 className="text-2xl font-extrabold">{me.name}</h1>
          <p className="text-sm text-muted-foreground">{me.programme} · Linköpings universitet · årskurs {me.year}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-bold">Underlag</h2>
          <p className="text-xs text-muted-foreground">I demon används exempeldata, ingen riktig fil laddas upp.</p>
          <div className="mt-3 space-y-3">
            <div>
              <Button onClick={() => { const a = demo.addCv(); setCvMsg(a.length ? `Tillagt från CV: ${a.join(", ")}` : "Inget nytt, CV:t var redan inläst."); }}><FileText className="size-4" />Ladda upp CV</Button>
              {cvMsg && <p className="mt-1 text-sm">{cvMsg}</p>}
            </div>
            <div>
              <Button variant="outline" onClick={() => { const a = demo.addLadok(); setLadokMsg(a.length ? `Tillagda kurser: ${a.map((c) => `${c} ${COURSE_BY_CODE[c]?.name}`).join(", ")}` : "Inget nytt, intyget var redan inläst."); }}><GraduationCap className="size-4" />Ladda upp Ladok-resultatintyg</Button>
              {ladokMsg && <p className="mt-1 text-sm">{ladokMsg}</p>}
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-bold">Kompetenser</h2>
          {skillSources(me).length === 0 ? <p className="text-sm text-muted-foreground">Ladda upp CV och Ladok-intyg för att se dina kompetenser.</p> : (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {skillSources(me).map((s) => <span key={s.skill} className="rounded-full bg-secondary px-2.5 py-1 text-xs">{s.skill} · {s.sources.join(", ")}</span>)}
            </div>
          )}
          <h2 className="mt-4 font-bold">Avklarade kurser</h2>
          <ul className="mt-1 text-sm">{me.courses.map((c) => <li key={c}>{c} {COURSE_BY_CODE[c]?.name}</li>)}</ul>
        </div>
      </section>
      <section>
        <h2 className="text-xl font-bold">Matchande jobb</h2>
        <div className="mt-3 space-y-3">
          {feed.map(({ job, m }) => (
            <Link key={job.id} to="/demo/jobb/$id" params={{ id: job.id }} className={`block rounded-2xl border bg-card p-4 hover:shadow-card ${job.boosted ? "border-2 border-highlight" : "border-border"}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold">{job.title}</p>
                {job.boosted && <span className="rounded bg-highlight px-2 py-0.5 text-xs font-bold text-foreground">Boostad</span>}
              </div>
              <p className="text-sm text-muted-foreground">{job.company} · {job.city}</p>
              <div className="mt-2"><MatchBadge m={m} /></div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
