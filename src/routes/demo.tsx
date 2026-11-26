import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { ArrowLeftRight, Building2, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompanyDemo } from "@/components/app/CompanyDemo";
import { StudentDemo } from "@/components/app/StudentDemo";
import { DEMO_COMPANY, DEMO_STUDENT_ID, useDemo } from "@/lib/demo/store";

export const Route = createFileRoute("/demo")({
  validateSearch: z.object({
    role: z.enum(["student", "company"]).catch("student"),
    view: z.enum(["home", "create", "students", "profile", "job"]).optional(),
    job: z.string().optional(),
    student: z.string().optional(),
  }),
  head: () => ({ meta: [{ title: "LaunchPad · Demo" }] }),
  ssr: false,
  component: DemoPage,
});

function DemoPage() {
  const { role, view, job, student } = Route.useSearch();
  const data = useDemo();
  const company = role === "company";
  const me = data.students.find((s) => s.id === DEMO_STUDENT_ID)!;
  const Icon = company ? Building2 : GraduationCap;
  return (
    <main lang="sv" className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-primary-soft p-5">
        <div className="flex items-center gap-3">
          <Icon className="size-6 text-primary" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide">
              {company ? "Företagsdemo" : "Studentdemo"}
            </p>
            <p className="font-display text-xl font-bold">
              {company ? DEMO_COMPANY.name : me.name}
            </p>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link to="/demo" search={{ role: company ? "student" : "company" }}>
            <ArrowLeftRight />
            {company ? "Växla till student" : "Växla till företag"}
          </Link>
        </Button>
      </div>
      {company ? (
        <CompanyDemo
          view={view}
          jobs={data.jobs.filter((j) => j.companyId === DEMO_COMPANY.id)}
          students={data.students}
          jobId={job}
          studentId={student}
        />
      ) : (
        <StudentDemo view={view} jobs={data.jobs} student={me} jobId={job} />
      )}
    </main>
  );
}
