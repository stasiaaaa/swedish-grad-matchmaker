export type MatchProfile = { skills: string[]; level?: string | null; cities?: string[]; lookingFor?: string[]; fields?: string[] };
export type MatchJob = { required_skills: string[]; min_level: string | null; city: string; role_type: string; fields?: string[]; looking_for: string };

const LEVEL_RANK: Record<string, number> = { Bachelor: 1, Master: 2, PhD: 3 };

/** Score 0-100: 60% required-skill overlap, 20% education level, 20% location preference. */
export function matchScore(job: MatchJob, p: MatchProfile) {
  const have = new Set(p.skills.map((s) => s.toLowerCase()));
  const req = job.required_skills;
  const matched = req.filter((s) => have.has(s.toLowerCase()));
  const skillPart = req.length ? matched.length / req.length : 0.5;
  const need = LEVEL_RANK[job.min_level ?? ""] ?? 0;
  const mine = LEVEL_RANK[p.level ?? ""] ?? 0;
  const levelPart = !need || !mine ? 0.5 : mine >= need ? 1 : 0.3;
  const cities = p.cities ?? [];
  const locPart = cities.length === 0 ? 0.5 : cities.includes(job.city) || job.city === "remote" ? 1 : 0;
  const score = Math.round(100 * (0.6 * skillPart + 0.2 * levelPart + 0.2 * locPart));
  return { score, matched, missing: req.filter((s) => !have.has(s.toLowerCase())) };
}
