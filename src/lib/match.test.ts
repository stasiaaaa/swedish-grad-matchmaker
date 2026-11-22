import { describe, expect, it } from "vitest";
import { matchScore } from "./match";

const job = { required_skills: ["Python", "C++", "Linux", "Git"], min_level: "Master", city: "stockholm", role_type: "x", looking_for: "thesis" };

describe("matchScore", () => {
  it("is 100 when all skills, level and city match", () => {
    expect(matchScore(job, { skills: ["python", "C++", "Linux", "Git"], level: "Master", cities: ["stockholm"] }).score).toBe(100);
  });
  it("weights skill overlap at 60%", () => {
    const r = matchScore(job, { skills: ["Python", "Git"], level: "Master", cities: ["stockholm"] });
    expect(r.score).toBe(70);
    expect(r.matched).toEqual(["Python", "Git"]);
    expect(r.missing).toEqual(["C++", "Linux"]);
  });
  it("gives no location points when the city is not preferred", () => {
    expect(matchScore(job, { skills: ["Python", "C++", "Linux", "Git"], level: "Master", cities: ["linkoping"] }).score).toBe(80);
  });
});
