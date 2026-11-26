import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { COURSE_BY_CODE } from "@/lib/demo/catalog";
import { demo } from "@/lib/demo/store";
import { matchJob, skillSources, sortFeed, type DemoJob, type DemoStudent } from "@/lib/demo/match";

export const card = "space-y-3 rounded-2xl border border-border bg-card p-5 shadow-card";
export const heading = "font-display text-3xl font-bold";
export const score = (m: ReturnType<typeof matchJob>) =>
  `${m.pct} % matchning · ${m.met} av ${m.total} krav uppfyllda`;

export function Profile({ student }: { student: DemoStudent }) {
  return (
    <section className={card}>
      <h2 className="text-xl font-bold">{student.name}</h2>
      <p>
        Linköpings universitet · {student.programme} · Årskurs {student.year}
      </p>
      <h3 className="font-bold">Kompetenser</h3>
      <div className="flex flex-wrap gap-2">
        {skillSources(student).map(({ skill, sources }) => (
          <Badge variant="secondary" key={skill}>
            {skill} · {sources.join(" + ")}
          </Badge>
        ))}
      </div>
      <h3 className="font-bold">Avklarade kurser</h3>
      <ul>
        {student.courses.map((code) => (
          <li key={code}>
            <CourseLink code={code} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function CourseLink({ code }: { code: string }) {
  const course = COURSE_BY_CODE[code]!;
  return (
    <a className="text-primary underline" href={course.url} target="_blank" rel="noreferrer">
      {code} · {course.name}
    </a>
  );
}

export function SampleUploads({
  onCv,
  onLadok,
}: {
  onCv: () => string[];
  onLadok: () => string[];
}) {
  const [feedback, setFeedback] = useState("");
  const upload = (items: string[], kind: string) =>
    setFeedback(
      items.length ? `${kind} lade till ${items.join(", ")}.` : `${kind} är redan inläst.`,
    );
  return (
    <section className={card}>
      <h2 className="text-xl font-bold">CV och Ladok</h2>
      <p className="text-muted-foreground">Knapparna läser in exempeldata för demon.</p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => upload(onCv(), "CV")}>Ladda upp CV</Button>
        <Button
          variant="outline"
          onClick={() =>
            upload(
              onLadok().map((c) => c + " " + COURSE_BY_CODE[c]!.name),
              "Ladok",
            )
          }
        >
          Ladda upp Ladok-resultatintyg
        </Button>
      </div>
      <p role="status">{feedback}</p>
    </section>
  );
}

export function StudentDemo({
  view,
  jobs,
  student,
  jobId,
}: {
  view?: string | undefined;
  jobs: DemoJob[];
  student: DemoStudent;
  jobId?: string | undefined;
}) {
  const job = jobs.find((j) => j.id === jobId);
  return (
    <>
      <nav className="flex gap-2" aria-label="Studentmeny">
        <Button asChild variant={view !== "profile" ? "default" : "outline"}>
          <Link to="/demo" search={{ role: "student" }}>
            Jobbflöde
          </Link>
        </Button>
        <Button asChild variant={view === "profile" ? "default" : "outline"}>
          <Link to="/demo" search={{ role: "student", view: "profile" }}>
            Min profil
          </Link>
        </Button>
      </nav>
      {view === "profile" ? (
        <>
          <h1 className={heading}>Min profil</h1>
          <SampleUploads onCv={demo.addCv} onLadok={demo.addLadok} />
          <Profile student={student} />
        </>
      ) : view === "job" && job ? (
        <JobDetails job={job} student={student} />
      ) : (
        <>
          <h1 className={heading}>Jobb för dig</h1>
          <div className="grid gap-4">
            {sortFeed(jobs, student).map(({ job: j, m }) => (
              <article key={j.id} className={card + (j.boosted ? " border-2 border-primary" : "")}>
                {j.boosted && <Badge>Boostad</Badge>}
                <p className="text-sm text-muted-foreground">
                  {j.company} · {j.city}
                </p>
                <h2 className="text-xl font-bold">
                  <Link
                    className="hover:underline"
                    to="/demo"
                    search={{ role: "student", view: "job", job: j.id }}
                  >
                    {j.title}
                  </Link>
                </h2>
                <p>{score(m)}</p>
              </article>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function JobDetails({ job, student }: { job: DemoJob; student: DemoStudent }) {
  const match = matchJob(job, student);
  return (
    <>
      <h1 className={heading}>{job.title}</h1>
      <p>
        {job.company} · {job.city}
      </p>
      <p className="whitespace-pre-line">{job.description}</p>
      <h2 className="text-xl font-bold">{score(match)}</h2>
      {match.reqs.map((r) => (
        <section className={card} key={r.skill}>
          <h3 className="font-bold">
            {r.skill} · {r.met ? "Uppfyllt" : "Saknas"}
          </h3>
          {r.viaCv && <Badge variant="secondary">Finns i CV</Badge>}
          {r.courses.length ? (
            <ul>
              {r.courses.map((c) => (
                <li key={c.code}>
                  <CourseLink code={c.code} /> · {c.done ? "Avklarad" : "Ej avklarad"}
                </li>
              ))}
            </ul>
          ) : (
            <p>Ingen kopplad LiU-kurs.</p>
          )}
        </section>
      ))}
    </>
  );
}
