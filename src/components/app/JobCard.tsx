import { Link } from "@tanstack/react-router";
import { MapPin, Clock, CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CompanyLogo } from "./CompanyLogo";
import { lookingForLabel, workModeLabel, timeAgo, daysUntil } from "@/lib/domain";
import type { JobRow } from "@/lib/queries";

export function JobCard({ job }: { job: JobRow }) {
  const left = daysUntil(job.deadline);
  return (
    <Link
      to="/jobs/$id"
      params={{ id: job.id }}
      className="group block rounded-2xl border border-border bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift"
    >
      <div className="flex gap-4">
        <CompanyLogo name={job.company?.name ?? "?"} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={job.looking_for === "thesis" ? "default" : "secondary"}>
              {lookingForLabel[job.looking_for]}
            </Badge>
            <span className="text-xs text-muted-foreground">{job.role_type}</span>
          </div>
          <h3 className="mt-2 text-lg font-semibold leading-snug group-hover:text-primary">{job.title}</h3>
          <p className="text-sm font-medium text-muted-foreground">{job.company?.name}</p>
          {job.summary && <p className="mt-3 line-clamp-3 text-sm text-foreground/80">{job.summary}</p>}
          {job.key_requirements.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
              {job.key_requirements.slice(0, 3).map((r) => (
                <li key={r} className="flex gap-2"><span className="text-primary">•</span>{r}</li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {job.required_skills.map((s) => (
              <span key={s} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{s}</span>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="size-3.5" />{job.location_label} · {workModeLabel[job.work_mode]}</span>
            <span className="flex items-center gap-1"><Clock className="size-3.5" />{timeAgo(job.posted_at)}</span>
            {left !== null && left >= 0 && (
              <span className={`flex items-center gap-1 ${left <= 7 ? "font-semibold text-destructive" : ""}`}>
                <CalendarClock className="size-3.5" />{left === 0 ? "Closes today" : `Closes in ${left} days`}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
