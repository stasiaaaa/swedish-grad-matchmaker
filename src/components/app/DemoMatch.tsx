import { Check, X } from "lucide-react";
import type { matchJob } from "@/lib/demo/match";

type M = ReturnType<typeof matchJob>;
export const matchLabel = (m: M) => `${m.pct} % matchning · ${m.met} av ${m.total} krav uppfyllda`;

export function MatchBadge({ m }: { m: M }) {
  return <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-accent-foreground">{matchLabel(m)}</span>;
}

/** Requirements with their LiU courses; courses marked Avklarad / Ej avklarad when a student is given. */
export function RequirementList({ m, showStatus = true }: { m: M; showStatus?: boolean }) {
  return (
    <ul className="space-y-3">
      {m.reqs.map((r) => (
        <li key={r.skill} className="rounded-xl border border-border bg-card p-3">
          <p className="flex items-center gap-2 font-semibold">
            {showStatus && (r.met ? <Check className="size-4 text-primary" /> : <X className="size-4 text-destructive" />)}
            {r.skill}
            {showStatus && <span className="text-xs font-normal text-muted-foreground">{r.met ? (r.viaCv ? "uppfyllt · CV" : "uppfyllt · kurs") : "saknas"}</span>}
          </p>
          {r.courses.length ? (
            <ul className="mt-2 space-y-1 text-sm">
              {r.courses.map((c) => (
                <li key={c.code} className="flex flex-wrap items-center gap-2">
                  <a href={c.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">{c.code} {c.name}</a>
                  {showStatus && <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${c.done ? "bg-primary-soft text-accent-foreground" : "bg-secondary text-muted-foreground"}`}>{c.done ? "Avklarad" : "Ej avklarad"}</span>}
                </li>
              ))}
            </ul>
          ) : <p className="mt-1 text-sm text-muted-foreground">Ingen LiU-kurs kopplad, matchas via CV.</p>}
        </li>
      ))}
    </ul>
  );
}
