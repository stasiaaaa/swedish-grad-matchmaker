import { COURSE_BY_CODE, coursesForSkill, skillLabel, norm, type Course } from "./catalog";

export type DemoStudent = {
  id: string;
  name: string;
  programme: string;
  year: number;
  cvSkills: string[];
  courses: string[];
};
export type DemoJob = {
  id: string;
  company: string;
  companyId: string;
  title: string;
  city: string;
  description: string;
  requirements: string[];
  boosted: boolean;
  sourceUrl?: string | undefined;
  createdAt: number;
};

export type ReqResult = {
  skill: string;
  met: boolean;
  viaCv: boolean;
  courses: (Course & { done: boolean })[];
};

/** Each requirement counts once; met when the CV has it or at least one completed course covers it. */
export function matchJob(
  job: Pick<DemoJob, "requirements">,
  s: Pick<DemoStudent, "cvSkills" | "courses">,
) {
  const cv = new Set(s.cvSkills.map(norm));
  const done = new Set(s.courses);
  const seen = new Set<string>();
  const reqs: ReqResult[] = [];
  for (const skill of job.requirements) {
    if (!norm(skill) || seen.has(norm(skill))) continue;
    seen.add(norm(skill));
    const courses = coursesForSkill(skill).map((x) => ({ ...x, done: done.has(x.code) }));
    const viaCv = cv.has(norm(skill));
    reqs.push({
      skill: skillLabel(skill),
      viaCv,
      courses,
      met: viaCv || courses.some((x) => x.done),
    });
  }
  const met = reqs.filter((r) => r.met).length;
  const pct = reqs.length ? Math.round((100 * met) / reqs.length) : 0;
  return { pct, met, total: reqs.length, reqs };
}

/** Boosted first, then by match within each group. Boost never changes the percentage. */
export function eligibleBoost(job: DemoJob, m: ReturnType<typeof matchJob>) {
  return job.boosted && 4 * m.met > m.total;
}
export function sortFeed(jobs: DemoJob[], s: DemoStudent) {
  return jobs
    .map((job) => ({ job, m: matchJob(job, s) }))
    .map((row) => ({ ...row, boosted: eligibleBoost(row.job, row.m) }))
    .sort(
      (a, b) =>
        Number(b.boosted) - Number(a.boosted) ||
        b.m.pct - a.m.pct ||
        b.job.createdAt - a.job.createdAt,
    );
}

/** Skills with where they came from, e.g. "Python · CV", "Maskininlärning · avklarad kurs". */
export function skillSources(s: DemoStudent) {
  const map = new Map<string, { skill: string; sources: string[] }>();
  const add = (skill: string, src: string) => {
    const e = map.get(norm(skill)) ?? { skill: skillLabel(skill), sources: [] };
    if (!e.sources.includes(src)) e.sources.push(src);
    map.set(norm(skill), e);
  };
  s.cvSkills.forEach((k) => add(k, "CV"));
  s.courses.forEach((code) =>
    COURSE_BY_CODE[code]?.skills.forEach((k) => add(k, `Completed course (${code})`)),
  );
  return [...map.values()];
}
