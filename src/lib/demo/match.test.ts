import { describe, expect, it } from "vitest";
import { matchJob, sortFeed, type DemoJob, type DemoStudent } from "./match";

const student: DemoStudent = { id: "s", name: "x", programme: "D", year: 4, cvSkills: ["React"], courses: ["TDDE01", "TDDE15"] };
const job = (id: string, requirements: string[], boosted = false): DemoJob => ({ id, company: "c", companyId: "c", title: id, city: "Linköping", description: "", requirements, boosted, createdAt: 0 });

describe("demo matching", () => {
  it("counts a requirement met by CV or a completed course, once each", () => {
    const m = matchJob(job("a", ["React", "Maskininlärning", "C++", "SQL"]), student);
    expect(m.met).toBe(2);
    expect(m.total).toBe(4);
    expect(m.pct).toBe(50);
  });
  it("counts a requirement once even when CV and several courses support it", () => {
    const m = matchJob(job("a", ["Maskininlärning", "maskininlärning"]), { ...student, cvSkills: ["Maskininlärning"] });
    expect(m.total).toBe(1);
    expect(m.pct).toBe(100);
  });
  it("marks relevant courses as completed or not", () => {
    const r = matchJob(job("a", ["C++"]), { ...student, courses: ["TDDE18"] }).reqs[0]!;
    expect(r.courses.map((x) => [x.code, x.done])).toEqual([["TDDE18", true], ["TDDD38", false]]);
  });
  it("puts boosted jobs first, sorted by match within each group, without changing the percentage", () => {
    const jobs = [job("low-boost", ["C++"], true), job("high", ["React"]), job("mid-boost", ["React", "C++"], true)];
    const feed = sortFeed(jobs, student);
    expect(feed.map((f) => f.job.id)).toEqual(["mid-boost", "low-boost", "high"]);
    expect(feed.find((f) => f.job.id === "low-boost")!.m.pct).toBe(matchJob(job("x", ["C++"]), student).pct);
  });
});
