import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CATALOG_SKILLS, coursesForSkill, norm } from "@/lib/demo/catalog";
import { matchJob, type DemoJob, type DemoStudent } from "@/lib/demo/match";
import { demo } from "@/lib/demo/store";
import { card, heading, score, CourseLink, Profile } from "./StudentDemo";

export function CompanyDemo({
  view,
  jobs,
  students,
  jobId,
  studentId,
}: {
  view?: string | undefined;
  jobs: DemoJob[];
  students: DemoStudent[];
  jobId?: string | undefined;
  studentId?: string | undefined;
}) {
  const job = jobs.find((j) => j.id === jobId);
  const student = students.find((s) => s.id === studentId);
  const list = { role: "company", view: "students", job: job?.id } as const;
  return (
    <>
      <nav className="flex flex-wrap gap-2" aria-label="Företagsmeny">
        <Button asChild variant="outline">
          <Link to="/demo" search={{ role: "company" }}>
            Mina annonser
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/demo" search={{ role: "company", view: "students" }}>
            Studentlista
          </Link>
        </Button>
        <Button asChild>
          <Link to="/demo" search={{ role: "company", view: "create" }}>
            Skapa jobbannons
          </Link>
        </Button>
      </nav>
      {view === "create" ? (
        <JobForm />
      ) : view === "profile" && student ? (
        <>
          <Link className="text-primary underline" to="/demo" search={list}>
            Tillbaka till studentlistan
          </Link>
          <Profile student={student} />
        </>
      ) : view === "students" ? (
        <>
          <h1 className={heading}>Studenter ({students.length})</h1>
          {job && <p>Matchning för {job.title}</p>}
          <ol className="grid gap-3 sm:grid-cols-2">
            {students
              .map((s) => ({ s, m: job && matchJob(job, s) }))
              .sort(
                (a, b) =>
                  (b.m?.pct ?? 0) - (a.m?.pct ?? 0) || a.s.name.localeCompare(b.s.name, "sv"),
              )
              .map(({ s, m }) => (
                <li className={card} key={s.id}>
                  <Link
                    className="font-bold text-primary underline"
                    to="/demo"
                    search={{ ...list, view: "profile", student: s.id }}
                  >
                    {s.name}
                  </Link>
                  <p>
                    {s.programme} · Årskurs {s.year}
                  </p>
                  {m && <p>{score(m)}</p>}
                </li>
              ))}
          </ol>
        </>
      ) : (
        <>
          <h1 className={heading}>Mina annonser</h1>
          {[...jobs]
            .sort((a, b) => b.createdAt - a.createdAt)
            .map((j) => (
              <article className={card} key={j.id}>
                <h2 className="text-xl font-bold">{j.title}</h2>
                <p>
                  {j.city} · {j.requirements.join(", ")}
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <Button asChild variant="outline">
                    <Link to="/demo" search={{ role: "company", view: "students", job: j.id }}>
                      Visa matchande studenter
                    </Link>
                  </Button>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={j.boosted}
                      onChange={(e) => demo.setBoost(j.id, e.target.checked)}
                    />
                    Boosta annons
                  </label>
                </div>
              </article>
            ))}
        </>
      )}
    </>
  );
}

function JobForm() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState("");
  const [requirements, setRequirements] = useState<string[]>([]);
  const [error, setError] = useState("");
  const withDraft = () => {
    const value = draft.trim();
    return value && !requirements.some((r) => norm(r) === norm(value))
      ? [...requirements, value]
      : requirements;
  };
  const add = () => {
    setRequirements(withDraft());
    setDraft("");
    setError("");
  };
  return (
    <>
      <h1 className={heading}>Skapa jobbannons</h1>
      <form
        className={card}
        onSubmit={(e) => {
          e.preventDefault();
          const fields = new FormData(e.currentTarget);
          const field = (key: string) => String(fields.get(key) ?? "").trim();
          const title = field("title"),
            city = field("city"),
            description = field("description");
          const reqs = withDraft();
          if (!title || !city || !description || !reqs.length) {
            setError("Ange titel, ort, beskrivning och minst ett kompetenskrav.");
            return;
          }
          demo.publish({ title, city, description, requirements: reqs });
          navigate({ to: "/demo", search: { role: "company" } });
        }}
      >
        <label className="block">
          Jobbtitel
          <Input name="title" required />
        </label>
        <label className="block">
          Ort
          <Input name="city" required />
        </label>
        <label className="block">
          Beskrivning
          <Textarea name="description" required />
        </label>
        <label htmlFor="requirement">Kompetenskrav</label>
        <div className="flex gap-2">
          <Input
            id="requirement"
            list="catalog-skills"
            placeholder="Exempelvis Python"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
          />
          <datalist id="catalog-skills">
            {CATALOG_SKILLS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <Button type="button" variant="outline" onClick={add}>
            Lägg till
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {requirements.map((r) => (
            <Button
              key={r}
              variant="secondary"
              size="sm"
              type="button"
              aria-label={"Ta bort " + r}
              onClick={() => setRequirements(requirements.filter((s) => s !== r))}
            >
              {r} ×
            </Button>
          ))}
        </div>
        {requirements.length > 0 && (
          <section>
            <h2 className="font-bold">Relevanta LiU-kurser</h2>
            {requirements.map((r) => {
              const courses = coursesForSkill(r);
              return (
                <div className="mt-2" key={r}>
                  <strong>{r}</strong>
                  {courses.length ? (
                    <ul>
                      {courses.map((c) => (
                        <li key={c.code}>
                          <CourseLink code={c.code} />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>Kan matchas genom CV.</p>
                  )}
                </div>
              );
            })}
          </section>
        )}
        {error && <p role="alert">{error}</p>}
        <Button type="submit">Publicera annons</Button>
      </form>
    </>
  );
}
