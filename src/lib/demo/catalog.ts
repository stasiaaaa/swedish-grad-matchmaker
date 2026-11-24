/** Real LiU courses (codes and names checked against studieinfo.liu.se), each mapped to a few skills. */
export type Course = { code: string; name: string; url: string; skills: string[] };

const c = (code: string, name: string, skills: string[]): Course => ({ code, name, url: `https://studieinfo.liu.se/kurs/${code}`, skills });

export const COURSES: Course[] = [
  c("TDDE44", "Programmering, grundkurs", ["Python"]),
  c("TDDE01", "Maskininlärning", ["Maskininlärning", "Python", "Statistik"]),
  c("TDDE15", "Avancerad maskininlärning", ["Maskininlärning", "Probabilistiska modeller"]),
  c("TDDC17", "Artificiell intelligens", ["AI", "Sökalgoritmer"]),
  c("TDDE09", "Språkteknologi", ["NLP", "Python"]),
  c("TDDE31", "Big Data Analytics", ["Big data", "Spark"]),
  c("TDDD97", "Webbprogrammering", ["Webbutveckling", "JavaScript"]),
  c("TDDD27", "Avancerad webbprogrammering", ["React", "Webbutveckling"]),
  c("TDDD37", "Databasteknik", ["SQL", "Databaser"]),
  c("TDDE18", "Programmera C++", ["C++"]),
  c("TDDD38", "Avancerad programmering i C++", ["C++"]),
  c("TDDD04", "Programvarutestning", ["Mjukvarutestning"]),
  c("TDDC88", "Programutvecklingsmetodik", ["Agil utveckling", "Projektledning"]),
  c("TSEA83", "Datorkonstruktion", ["Hårdvarunära programmering", "VHDL"]),
  c("TSRT12", "Reglerteknik", ["Reglerteknik", "MATLAB"]),
  c("TATA24", "Linjär algebra", ["Linjär algebra"]),
];

export const COURSE_BY_CODE = Object.fromEntries(COURSES.map((x) => [x.code, x])) as Record<string, Course>;

export const norm = (s: string) => s.trim().toLowerCase();

/** Every skill the catalog knows, for requirement suggestions. */
export const CATALOG_SKILLS = [...new Set(COURSES.flatMap((x) => x.skills).concat(["Git", "Docker", "TypeScript", "Java"]))].sort((a, b) => a.localeCompare(b, "sv"));

export const coursesForSkill = (skill: string) => COURSES.filter((x) => x.skills.some((s) => norm(s) === norm(skill)));
