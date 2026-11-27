/** Real LiU courses (codes and names checked against studieinfo.liu.se), each mapped to a few skills. */
export type Course = { code: string; name: string; url: string; skills: string[] };

const c = (code: string, name: string, skills: string[]): Course => ({
  code,
  name,
  url: `https://studieinfo.liu.se/kurs/${code}`,
  skills,
});

export const COURSES: Course[] = [
  c("TDDE44", "Introductory programming", ["Python"]),
  c("TDDE01", "Machine learning", ["Machine learning", "Python", "Statistics"]),
  c("TDDE15", "Advanced machine learning", ["Machine learning", "Probabilistic models"]),
  c("TDDC17", "Artificial intelligence", ["AI", "Search algorithms"]),
  c("TDDE09", "Language technology", ["NLP", "Python"]),
  c("TDDE31", "Big Data Analytics", ["Big data", "Spark"]),
  c("TDDD97", "Web programming", ["Web development", "JavaScript"]),
  c("TDDD27", "Advanced web programming", ["React", "Web development"]),
  c("TDDD37", "Database technology", ["SQL", "Databases"]),
  c("TDDE18", "Programming in C++", ["C++"]),
  c("TDDD38", "Advanced programming in C++", ["C++"]),
  c("TDDD04", "Software testing", ["Software testing"]),
  c("TDDC88", "Software engineering methodology", ["Agile development", "Project management"]),
  c("TSEA83", "Computer design", ["Low-level programming", "VHDL"]),
  c("TSRT12", "Control engineering", ["Control engineering", "MATLAB"]),
  c("TATA24", "Linear algebra", ["Linear algebra"]),
];

export const COURSE_BY_CODE = Object.fromEntries(COURSES.map((x) => [x.code, x])) as Record<
  string,
  Course
>;

const legacySkills: Record<string, string> = {
  maskininlärning: "Machine learning",
  statistik: "Statistics",
  "probabilistiska modeller": "Probabilistic models",
  sökalgoritmer: "Search algorithms",
  webbutveckling: "Web development",
  databaser: "Databases",
  mjukvarutestning: "Software testing",
  "agil utveckling": "Agile development",
  projektledning: "Project management",
  "hårdvarunära programmering": "Low-level programming",
  reglerteknik: "Control engineering",
  "linjär algebra": "Linear algebra",
};
export const skillLabel = (s: string) =>
  Object.hasOwn(legacySkills, s.trim().toLowerCase())
    ? legacySkills[s.trim().toLowerCase()]!
    : s.trim();
export const norm = (s: string) => skillLabel(s).toLowerCase();

/** Every skill the catalog knows, for requirement suggestions. */
export const CATALOG_SKILLS = [
  ...new Set(COURSES.flatMap((x) => x.skills).concat(["Git", "Docker", "TypeScript", "Java"])),
].sort((a, b) => a.localeCompare(b, "sv"));

export const coursesForSkill = (skill: string) =>
  COURSES.filter((x) => x.skills.some((s) => norm(s) === norm(skill)));
