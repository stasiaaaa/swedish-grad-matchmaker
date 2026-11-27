import { createFileRoute, Link } from "@tanstack/react-router";
import { matchJob } from "@/lib/demo/match";
import { useDemo } from "@/lib/demo/store";
import { MatchBadge, RequirementList } from "@/components/app/DemoMatch";

export const Route = createFileRoute("/demo/jobb/$id")({ component: JobView });

function JobView() {
  const { id } = Route.useParams();
  const st = useDemo();
  const job = st.jobs.find((j) => j.id === id);
  if (!job) return <main className="mx-auto max-w-3xl px-4 py-10">Annonsen finns inte. <Link to="/demo/student" className="text-primary">Tillbaka</Link></main>;
  const m = matchJob(job, st.students[0]!);
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/demo/student" className="text-sm text-primary">← Tillbaka till jobben</Link>
      <h1 className="mt-2 text-3xl font-extrabold">{job.title}</h1>
      <p className="text-muted-foreground">{job.company} · {job.city}{job.boosted && " · Boostad"}</p>
      <div className="mt-3"><MatchBadge m={m} /></div>
      <p className="mt-4">{job.description}</p>
      <h2 className="mt-6 text-lg font-bold">Efterfrågade kompetenser och relevanta LiU-kurser</h2>
      <div className="mt-3"><RequirementList m={m} /></div>
    </main>
  );
}
