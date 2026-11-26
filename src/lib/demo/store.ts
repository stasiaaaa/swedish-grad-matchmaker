import { useSyncExternalStore } from "react";
import { COURSES, type Course } from "./catalog";
import type { DemoJob, DemoStudent } from "./match";

export const DEMO_COMPANY = { id: "ostgota-digital", name: "Östgöta Digital AB", city: "Linköping" };
export const DEMO_STUDENT_ID = "s01";

/** What the simulated uploads add (no real file is read). */
export const SAMPLE_CV_SKILLS = ["Python", "React", "JavaScript", "Git", "SQL"];
export const SAMPLE_LADOK = ["TDDE44", "TDDE01", "TDDC17", "TDDD97", "TDDD37", "TATA24"];

const FIRST = ["Elsa", "Oscar", "Maja", "Liam", "Alva", "Hugo", "Ella", "William", "Wilma", "Noah", "Astrid", "Lucas", "Saga", "Elias", "Ebba", "Axel", "Freja", "Leo", "Agnes", "Isak", "Selma", "Viktor", "Linnea", "Albin", "Tilda"];
const LAST = ["Lind", "Berg", "Holm", "Ek", "Sjöberg", "Nyström", "Wikström", "Lundqvist", "Forsberg", "Dahl", "Strand", "Hedlund", "Åberg", "Blom", "Falk"];
const PROGRAMMES = ["Civilingenjör i datateknik", "Civilingenjör i mjukvaruteknik", "Civilingenjör i teknisk fysik och elektroteknik", "Civilingenjör i industriell ekonomi", "Civilingenjör i medieteknik", "Civilingenjör i informationsteknologi"];
const CV_POOL = ["Python", "React", "JavaScript", "TypeScript", "Git", "Docker", "SQL", "C++", "Java", "MATLAB", "Maskininlärning", "Projektledning", "Agil utveckling", "Mjukvarutestning", "Webbutveckling"];

function rng(seed: number) {
  return () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
}
const pick = <T,>(r: () => number, arr: T[], n: number) => [...arr].sort(() => r() - 0.5).slice(0, n);

/** Exactly 50 fictional LiU students; deterministic so every reload produces the same people. */
export function seedStudents(): DemoStudent[] {
  const r = rng(42);
  return Array.from({ length: 50 }, (_, i) => {
    const id = `s${String(i + 1).padStart(2, "0")}`;
    if (i === 0) return { id, name: "Elsa Lind", programme: PROGRAMMES[0]!, year: 4, cvSkills: ["React"], courses: ["TDDD97"] };
    const name = `${FIRST[i % FIRST.length]} ${LAST[Math.floor(r() * LAST.length)]}`;
    return {
      id, name,
      programme: PROGRAMMES[Math.floor(r() * PROGRAMMES.length)]!,
      year: 1 + Math.floor(r() * 5),
      cvSkills: pick(r, CV_POOL, 2 + Math.floor(r() * 5)),
      courses: pick(r, COURSES, 2 + Math.floor(r() * 8)).map((x: Course) => x.code),
    };
  });
}

export function seedJobs(): DemoJob[] {
  const t = Date.UTC(2026, 10, 1);
  return [
    { id: "j1", company: DEMO_COMPANY.name, companyId: DEMO_COMPANY.id, title: "Frontendutvecklare, trainee", city: "Linköping", description: "Bygg moderna webbappar för kunder i Östergötland.", requirements: ["React", "JavaScript", "Webbutveckling", "Mjukvarutestning"], boosted: false, createdAt: t },
    { id: "j2", company: DEMO_COMPANY.name, companyId: DEMO_COMPANY.id, title: "Backendutvecklare, sommarjobb", city: "Norrköping", description: "Utveckla API:er och databaser i ett agilt team.", requirements: ["SQL", "Databaser", "Agil utveckling"], boosted: false, createdAt: t + 1 },
    { id: "j3", company: "Valla Systems AB", companyId: "valla", title: "Inbyggda system-ingenjör", city: "Linköping", description: "Styrsystem för drönare, från hårdvara till regleralgoritmer.", requirements: ["C++", "Reglerteknik", "Hårdvarunära programmering", "Python"], boosted: true, createdAt: t + 2 },
    { id: "j4", company: "Mjärdevi Analytics AB", companyId: "mjardevi", title: "Data scientist, examensarbete", city: "Linköping", description: "Examensarbete om prognosmodeller för energidata.", requirements: ["Python", "Maskininlärning", "Statistik", "Big data"], boosted: false, createdAt: t + 3 },
  ];
}

type State = { version: 1; students: DemoStudent[]; jobs: DemoJob[] };
const KEY = "launchpad_demo_v1";
let state: State | null = null;
const listeners = new Set<() => void>();

function load(): State {
  if (state) return state;
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(KEY) : null;
    if (raw) { const s = JSON.parse(raw) as State; if (s.version === 1 && s.students?.length === 50) return (state = s); }
  } catch { /* fall through to seed */ }
  state = { version: 1, students: seedStudents(), jobs: seedJobs() };
  if (typeof localStorage !== "undefined") localStorage.setItem(KEY, JSON.stringify(state));
  return state;
}
function set(fn: (s: State) => State) {
  state = fn(load());
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

export function useDemo() {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, load, load);
}

const uniq = (xs: string[]) => [...new Map(xs.map((x) => [x.toLowerCase(), x])).values()];

export const demo = {
  /** Returns the items that were new. */
  addCv() {
    const s = load().students[0]!;
    const added = SAMPLE_CV_SKILLS.filter((k) => !s.cvSkills.some((x) => x.toLowerCase() === k.toLowerCase()));
    set((st) => ({ ...st, students: st.students.map((x) => (x.id === DEMO_STUDENT_ID ? { ...x, cvSkills: uniq([...x.cvSkills, ...SAMPLE_CV_SKILLS]) } : x)) }));
    return added;
  },
  addLadok() {
    const s = load().students[0]!;
    const added = SAMPLE_LADOK.filter((c) => !s.courses.includes(c));
    set((st) => ({ ...st, students: st.students.map((x) => (x.id === DEMO_STUDENT_ID ? { ...x, courses: [...new Set([...x.courses, ...SAMPLE_LADOK])] } : x)) }));
    return added;
  },
  publish(job: Omit<DemoJob, "id" | "company" | "companyId" | "boosted" | "createdAt">) {
    const id = crypto.randomUUID();
    set((st) => ({ ...st, jobs: [...st.jobs, { ...job, requirements: uniq(job.requirements), id, company: DEMO_COMPANY.name, companyId: DEMO_COMPANY.id, boosted: false, createdAt: Date.now() }] }));
    return id;
  },
  setBoost(id: string, boosted: boolean) {
    set((st) => ({ ...st, jobs: st.jobs.map((j) => (j.id === id ? { ...j, boosted } : j)) }));
  },
  reset() {
    set(() => ({ version: 1, students: seedStudents(), jobs: seedJobs() }));
  },
};
