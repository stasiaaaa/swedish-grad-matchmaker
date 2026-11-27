import { createFileRoute, Link } from "@tanstack/react-router";
import { eligibleBoost, matchJob } from "@/lib/demo/match";
import { currentAccount, demo, useDemo } from "@/lib/demo/store";
import { useListings } from "@/lib/demo/listings";
import { MatchBadge, RequirementList } from "@/components/app/DemoMatch";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/demo/jobb/$id")({ component: JobView });
function JobView() {
  const { id } = Route.useParams();
  const account = currentAccount(useDemo());
  const listings = useListings();
  if (account?.role !== "student") return null;
  const tracked = account.tracked.find((x) => x.job.id === id);
  const job = listings.find((j) => j.id === id) ?? tracked?.job;
  if (!job)
    return (
      <main className="mx-auto max-w-3xl p-8">
        Listing unavailable. <Link to="/demo/student">Back to jobs</Link>
      </main>
    );
  const m = matchJob(job, account.profile);
  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-8">
      <Link to="/demo/student" className="text-primary">
        ← Back to jobs
      </Link>
      <h1 className="text-3xl font-bold">{job.title}</h1>
      <p>
        {job.company} · {job.city}
        {eligibleBoost(job, m) && " · Boosted"}
      </p>
      <MatchBadge m={m} />
      <p>{job.description}</p>
      <Button variant="outline" disabled={!!tracked} onClick={() => demo.track(job, "Saved")}>
        {tracked?.stage || "Save job"}
      </Button>
      {job.sourceUrl && /^https?:\/\//i.test(job.sourceUrl) && (
        <div>
          <Button asChild>
            <a
              href={job.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => demo.track(job, "Applied")}
            >
              Apply on company site
            </a>
          </Button>
          <p className="mt-2 text-sm text-muted-foreground">
            Opening the company site marks this job as applied in your personal tracker.
          </p>
        </div>
      )}
      <h2 className="text-xl font-bold">Skill requirements and relevant LiU courses</h2>
      <RequirementList m={m} />
    </main>
  );
}
