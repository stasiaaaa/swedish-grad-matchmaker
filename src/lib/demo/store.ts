import { useSyncExternalStore } from "react";
import { skillLabel, norm } from "./catalog";
import { COURSES, type Course } from "./catalog";
import type { DemoJob, DemoStudent } from "./match";

export const DEMO_COMPANY = {
  id: "ostgota-digital",
  name: "Östgöta Digital AB",
  city: "Linköping",
};

/** What the simulated uploads add (no real file is read). */
export const SAMPLE_CV_SKILLS = ["Python", "React", "JavaScript", "Git", "SQL"];
export const SAMPLE_LADOK = ["TDDE44", "TDDE01", "TDDC17", "TDDD97", "TDDD37", "TATA24"];

const FIRST = [
  "Elsa",
  "Oscar",
  "Maja",
  "Liam",
  "Alva",
  "Hugo",
  "Ella",
  "William",
  "Wilma",
  "Noah",
  "Astrid",
  "Lucas",
  "Saga",
  "Elias",
  "Ebba",
  "Axel",
  "Freja",
  "Leo",
  "Agnes",
  "Isak",
  "Selma",
  "Viktor",
  "Linnea",
  "Albin",
  "Tilda",
];
const LAST = [
  "Lind",
  "Berg",
  "Holm",
  "Ek",
  "Sjöberg",
  "Nyström",
  "Wikström",
  "Lundqvist",
  "Forsberg",
  "Dahl",
  "Strand",
  "Hedlund",
  "Åberg",
  "Blom",
  "Falk",
];
const PROGRAMMES = [
  "Computer Science and Engineering",
  "Software Engineering",
  "Applied Physics and Electrical Engineering",
  "Industrial Engineering and Management",
  "Media Technology",
  "Information Technology",
];
const CV_POOL = [
  "Python",
  "React",
  "JavaScript",
  "TypeScript",
  "Git",
  "Docker",
  "SQL",
  "C++",
  "Java",
  "MATLAB",
  "Machine learning",
  "Project management",
  "Agile development",
  "Software testing",
  "Web development",
];

function rng(seed: number) {
  return () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
}
const pick = <T>(r: () => number, arr: T[], n: number) =>
  [...arr].sort(() => r() - 0.5).slice(0, n);

/** Exactly 50 fictional LiU students; deterministic so every reload produces the same people. */
export function seedStudents(): DemoStudent[] {
  const r = rng(42);
  return Array.from({ length: 50 }, (_, i) => {
    const id = `s${String(i + 1).padStart(2, "0")}`;
    if (i === 0)
      return {
        id,
        name: "Elsa Lind",
        programme: PROGRAMMES[0]!,
        year: 4,
        cvSkills: ["React"],
        courses: ["TDDD97"],
      };
    const name = `${FIRST[i % FIRST.length]} ${LAST[Math.floor(r() * LAST.length)]}`;
    return {
      id,
      name,
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
    {
      id: "j1",
      company: DEMO_COMPANY.name,
      companyId: DEMO_COMPANY.id,
      title: "Frontend engineering trainee",
      city: "Linköping",
      description: "Build web applications for clients in Östergötland.",
      requirements: ["React", "JavaScript", "Web development", "Software testing"],
      boosted: false,
      createdAt: t,
    },
    {
      id: "j2",
      company: DEMO_COMPANY.name,
      companyId: DEMO_COMPANY.id,
      title: "Summer backend developer",
      city: "Norrköping",
      description: "Develop APIs and databases in an agile team.",
      requirements: ["SQL", "Databases", "Agile development"],
      boosted: false,
      createdAt: t + 1,
    },
    {
      id: "j3",
      company: "Valla Systems AB",
      companyId: "valla",
      title: "Embedded systems engineer",
      city: "Linköping",
      description: "Develop flight control software for drones.",
      requirements: ["C++", "Control engineering", "Git", "Python"],
      boosted: true,
      createdAt: t + 2,
    },
    {
      id: "j4",
      company: "Mjärdevi Analytics AB",
      companyId: "mjardevi",
      title: "Data science thesis",
      city: "Linköping",
      description: "Research forecasting models for energy data.",
      requirements: ["Python", "Machine learning", "Statistics", "Big data"],
      boosted: false,
      createdAt: t + 3,
    },
  ];
}

export type Role = "company" | "student";
export const stages = ["Saved", "Applied", "Interview", "Offer", "Rejected"] as const;
export type Stage = (typeof stages)[number];
type TrackedJob = { job: DemoJob; stage: Stage };
type Account = {
  id: string;
  role: Role;
  email: string;
  name: string;
  salt: string;
  verifier: string;
  profile: DemoStudent;
  preferences: string[];
  cart: string[];
  tracked: TrackedJob[];
};
type State = {
  accounts: Account[];
  session: string | null;
  students: DemoStudent[];
  jobs: DemoJob[];
};
const KEY = "launchpad_accounts_v2";
const initial: State = { accounts: [], session: null, students: seedStudents(), jobs: seedJobs() };
let cachedRaw: string | null | undefined;
let cached: State = initial;

function load(): State {
  if (typeof window === "undefined") return initial;
  const raw = localStorage.getItem(KEY);
  if (raw === cachedRaw) return cached;
  if (raw) {
    cached = JSON.parse(raw);
  } else {
    let legacy: { jobs?: DemoJob[] } | null = null;
    try {
      legacy = JSON.parse(localStorage.getItem("launchpad_demo_v1") || "null");
    } catch {
      /* An incomplete v1 snapshot has no listings to import. */
    }
    const jobs = new Map(initial.jobs.map((j) => [j.id, j]));
    for (const job of Array.isArray(legacy?.jobs) ? legacy.jobs : []) {
      const seed = jobs.get(job.id);
      jobs.set(job.id, {
        ...job,
        ...(seed && { title: seed.title, description: seed.description }),
        requirements: job.requirements.map(skillLabel),
        boosted: job.boosted,
      });
    }
    cached = { ...initial, jobs: [...jobs.values()] };
  }
  cachedRaw = raw;
  return cached;
}
const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  window.addEventListener("storage", l);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", l);
  };
}
function save(s: State) {
  const raw = JSON.stringify(s);
  localStorage.setItem(KEY, raw);
  cachedRaw = raw;
  cached = s;
  notify();
}
export function currentAccount(s = load()) {
  return s.accounts.find((a) => a.id === s.session);
}
export function useDemo() {
  return useSyncExternalStore(subscribe, load, () => initial);
}
export const homeFor = (role: Role) => (role === "company" ? "/demo/foretag" : "/demo/student");
function requireAccount(role: Role) {
  const a = currentAccount();
  if (!a || a.role !== role) throw new Error("Please log in with the appropriate profile.");
  return a;
}
function update(a: Account, changes: Partial<Account>, jobs = load().jobs) {
  const s = load();
  save({
    ...s,
    jobs,
    accounts: s.accounts.map((account) =>
      account.id === a.id ? { ...account, ...changes } : account,
    ),
  });
}
async function verify(password: string, salt: string) {
  const bytes = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", bytes.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: bytes.encode(salt), iterations: 210000 },
    key,
    256,
  );
  return Array.from(new Uint8Array(bits), (n) => n.toString(16).padStart(2, "0")).join("");
}
export const demo = {
  async register(name: string, email: string, password: string, role: Role) {
    const username = email.trim().toLowerCase();
    if (!name.trim() || !username || !password)
      throw new Error("Enter a name, email and password.");
    const id = crypto.randomUUID(),
      salt = crypto.randomUUID();
    const verifier = await verify(password, salt);
    const s = load();
    if (s.accounts.some((a) => a.email === username))
      throw new Error("A profile with this email already exists.");
    const account: Account = {
      id,
      email: username,
      name: name.trim(),
      role,
      salt,
      verifier,
      profile: {
        id,
        name: name.trim(),
        programme: PROGRAMMES[0]!,
        year: 1,
        cvSkills: [],
        courses: [],
      },
      preferences: [],
      tracked: [],
      cart: [],
    };
    save({ ...s, accounts: [...s.accounts, account], session: id });
    return account;
  },
  async login(email: string, password: string) {
    const a = load().accounts.find((account) => account.email === email.trim().toLowerCase());
    if (!a || (await verify(password, a.salt)) !== a.verifier)
      throw new Error("Incorrect email or password.");
    save({ ...load(), session: a.id });
    return a;
  },
  logout() {
    save({ ...load(), session: null });
  },
  profile(changes: Partial<Pick<DemoStudent, "programme" | "year">>) {
    const a = requireAccount("student");
    update(a, { profile: { ...a.profile, ...changes } });
  },
  preferences(preferences: string[]) {
    update(requireAccount("student"), { preferences });
  },
  upload(field: "cvSkills" | "courses") {
    const a = requireAccount("student");
    const sample = field === "courses" ? SAMPLE_LADOK : SAMPLE_CV_SKILLS;
    const existing = a.profile[field];
    const added = sample.filter((item) => !existing.some((x) => norm(x) === norm(item)));
    update(a, { profile: { ...a.profile, [field]: [...existing, ...added] } });
    return added;
  },
  publish(job: Omit<DemoJob, "id" | "company" | "companyId" | "boosted" | "createdAt">) {
    const a = requireAccount("company");
    const id = crypto.randomUUID();
    save({
      ...load(),
      jobs: [
        ...load().jobs,
        { ...job, id, company: a.name, companyId: a.id, boosted: false, createdAt: Date.now() },
      ],
    });
    return id;
  },
  cart(id: string, add: boolean) {
    const a = requireAccount("company");
    if (!load().jobs.some((j) => j.id === id && j.companyId === a.id && !j.boosted)) return;
    const cart = a.cart.filter((x) => x !== id);
    update(a, { cart: add ? [...cart, id] : cart });
  },
  pay() {
    const a = requireAccount("company");
    update(
      a,
      { cart: [] },
      load().jobs.map((j) =>
        j.companyId === a.id && a.cart.includes(j.id) ? { ...j, boosted: true } : j,
      ),
    );
  },
  track(job: DemoJob, stage: Stage) {
    const a = requireAccount("student");
    const existing = a.tracked.find((x) => x.job.id === job.id);
    if (existing && (stage === "Saved" || (stage === "Applied" && existing.stage !== "Saved")))
      return;
    update(a, { tracked: [...a.tracked.filter((x) => x.job.id !== job.id), { job, stage }] });
  },
};
