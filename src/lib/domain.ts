export const LOOKING_FOR = [
  { key: "thesis", label: "Master's thesis project", short: "Thesis" },
  { key: "internship", label: "Internship", short: "Internship" },
  { key: "graduate", label: "Graduate/trainee programme", short: "Graduate" },
  { key: "student_job", label: "Student job (part-time)", short: "Student job" },
  { key: "full_time", label: "Full-time", short: "Full-time" },
] as const;
export type LookingFor = (typeof LOOKING_FOR)[number]["key"];

export const CITIES = [
  { key: "linkoping", label: "Linköping" },
  { key: "stockholm", label: "Stockholm" },
  { key: "gothenburg", label: "Gothenburg" },
  { key: "other", label: "Other Sweden" },
  { key: "remote", label: "Remote" },
] as const;

export const ROLE_TYPES = [
  "Software Engineering", "Embedded and Systems", "AI/ML and Data", "Cybersecurity", "Automotive",
  "Aerospace and Defence", "Energy and Power", "Industrial and Production", "Telecom",
  "Electronics and Hardware", "Management Consulting", "Finance and Quant", "R&D and Life Science",
] as const;

export const WORK_MODES = [
  { key: "onsite", label: "On-site" },
  { key: "hybrid", label: "Hybrid" },
  { key: "remote", label: "Remote" },
] as const;

const map = <T extends { key: string; label: string }>(arr: readonly T[]) =>
  Object.fromEntries(arr.map((x) => [x.key, x.label])) as Record<string, string>;
export const lookingForLabel = map(LOOKING_FOR);
export const cityLabel = map(CITIES);
export const workModeLabel = map(WORK_MODES);

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 3600) return `${Math.max(1, Math.round(diff / 60))} min ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)} hours ago`;
  const d = Math.round(diff / 86400);
  return d === 1 ? "1 day ago" : `${d} days ago`;
}

export function daysUntil(date: string | null | undefined): number | null {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}
