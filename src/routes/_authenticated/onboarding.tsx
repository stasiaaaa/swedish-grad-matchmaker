import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown, X, Plus, Trash2, FileUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { skillNamesQuery, universitiesQuery } from "@/lib/queries";
import { CITIES, LEVELS, LOOKING_FOR, PROGRAMMES, ROLE_TYPES, SKILL_CATEGORIES, WORK_MODES } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Your profile — LaunchPad" }, { name: "robots", content: "noindex" }] }),
  component: Onboarding,
});

type Skill = { skill: string; level: string };
type Exp = { title: string; company: string; start_date: string; end_date: string; description: string };
const STEPS = ["Education", "Skills", "Experience", "Preferences"];

function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: unis = [] } = useQuery(universitiesQuery());
  const { data: allSkills = [] } = useQuery(skillNamesQuery());
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uni, setUni] = useState("");
  const [programme, setProgramme] = useState("");
  const [level, setLevel] = useState("Master");
  const [grad, setGrad] = useState(String(new Date().getFullYear() + 1));
  const [skills, setSkills] = useState<Skill[]>([]);
  const [exps, setExps] = useState<Exp[]>([]);
  const [lf, setLf] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [modes, setModes] = useState<string[]>([]);
  const [fields, setFields] = useState<string[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("student_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("student_skills").select("skill,level").eq("user_id", user.id),
      supabase.from("experiences").select("title,company,start_date,end_date,description").eq("user_id", user.id),
    ]).then(([p, s, e]) => {
      const d = p.data;
      if (d) {
        setUni(d.university ?? ""); setProgramme(d.programme ?? ""); setLevel(d.study_level ?? "Master");
        if (d.grad_year) setGrad(String(d.grad_year));
        setLf(d.looking_for); setCities(d.cities); setModes(d.work_modes); setFields(d.fields); setVisible(d.visible_to_companies);
      }
      if (s.data) setSkills(s.data);
      if (e.data) setExps(e.data.map((x) => ({ title: x.title, company: x.company, start_date: x.start_date ?? "", end_date: x.end_date ?? "", description: x.description ?? "" })));
    });
  }, [user]);

  const canNext = [!!uni && !!programme && !!level && !!grad, skills.length > 0, true, lf.length > 0][step];

  const finish = async (): Promise<void> => {
    if (!user) return;
    setSaving(true);
    const uid = user.id;
    const p = await supabase.from("student_profiles").upsert({
      user_id: uid, university: uni, programme, study_level: level as "Master", grad_year: Number(grad),
      looking_for: lf, cities, work_modes: modes, fields, visible_to_companies: visible, onboarded: true, updated_at: new Date().toISOString(),
    });
    await supabase.from("student_skills").delete().eq("user_id", uid);
    const s = skills.length ? await supabase.from("student_skills").insert(skills.map((x) => ({ user_id: uid, skill: x.skill, level: x.level as "Beginner" }))) : { error: null };
    await supabase.from("experiences").delete().eq("user_id", uid);
    const valid = exps.filter((x) => x.title && x.company);
    const e = valid.length ? await supabase.from("experiences").insert(valid.map((x) => ({ user_id: uid, title: x.title, company: x.company, start_date: x.start_date || null, end_date: x.end_date || null, description: x.description || null }))) : { error: null };
    setSaving(false);
    const err = p.error ?? s.error ?? e.error;
    if (err) { toast.error(err.message); return; }
    qc.invalidateQueries();
    toast.success("Profile saved");
    navigate({ to: "/my-jobs" });
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-2 flex justify-between text-sm font-medium"><span>Step {step + 1} of 4 · {STEPS[step]}</span><span className="text-muted-foreground">About 3 minutes</span></div>
      <Progress value={((step + 1) / 4) * 100} />
      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card md:p-8">
        {step === 0 && (
          <div className="space-y-4">
            <h1 className="text-2xl font-extrabold">Where do you study?</h1>
            <Field label="University"><Combo value={uni} onChange={setUni} placeholder="Search universities" groups={[
              { heading: "Popular", items: unis.filter((u) => u.featured).map((u) => u.name) },
              { heading: "Sweden", items: unis.filter((u) => !u.featured && u.country === "Sweden").map((u) => u.name) },
              { heading: "Europe", items: unis.filter((u) => u.country !== "Sweden").map((u) => u.name) },
            ]} /></Field>
            <Field label="Programme"><Combo value={programme} onChange={setProgramme} placeholder="Search programmes" allowCustom groups={[{ heading: "Programmes", items: [...PROGRAMMES] }]} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Study level">
                <Select value={level} onValueChange={setLevel}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Bachelor", "Master", "PhD"].map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select>
              </Field>
              <Field label="Expected graduation">
                <Select value={grad} onValueChange={setGrad}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Array.from({ length: 8 }, (_, i) => String(new Date().getFullYear() - 2 + i)).map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select>
              </Field>
            </div>
          </div>
        )}
        {step === 1 && <SkillsStep all={allSkills} skills={skills} setSkills={setSkills} />}
        {step === 2 && <ExpStep exps={exps} setExps={setExps} />}
        {step === 3 && (
          <div className="space-y-5">
            <h1 className="text-2xl font-extrabold">What are you looking for?</h1>
            <Multi label="I'm looking for" options={LOOKING_FOR.map((l) => [l.key, l.label])} value={lf} onChange={setLf} />
            <Multi label="Preferred cities" options={CITIES.map((c) => [c.key, c.label])} value={cities} onChange={setCities} />
            <Multi label="Work mode" options={WORK_MODES.map((m) => [m.key, m.label])} value={modes} onChange={setModes} />
            <Multi label="Fields of interest" options={ROLE_TYPES.map((r) => [r, r])} value={fields} onChange={setFields} />
            <label className="flex items-start gap-3 rounded-xl border border-border p-4">
              <Switch checked={visible} onCheckedChange={setVisible} className="mt-0.5" />
              <span className="text-sm"><span className="font-semibold">Let companies find me</span><br /><span className="text-muted-foreground">I agree that approved companies on LaunchPad can see my education, skills and experience. You can turn this off at any time.</span></span>
            </label>
          </div>
        )}
        <div className="mt-8 flex justify-between">
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</Button>
          {step < 3 ? (
            <Button disabled={!canNext} onClick={() => setStep(step + 1)}>{step === 2 && exps.length === 0 ? "Skip for now" : "Continue"}</Button>
          ) : (
            <Button disabled={!canNext || saving} onClick={finish}>{saving ? "Saving…" : "Finish profile"}</Button>
          )}
        </div>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

function Combo({ value, onChange, placeholder, groups, allowCustom }: { value: string; onChange: (v: string) => void; placeholder: string; groups: { heading: string; items: string[] }[]; allowCustom?: boolean }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
          <span className={value ? "" : "text-muted-foreground"}>{value || placeholder}</span><ChevronsUpDown className="size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder={placeholder} value={q} onValueChange={setQ} />
          <CommandList>
            <CommandEmpty>
              {allowCustom && q ? <button className="w-full px-2 py-1.5 text-left text-sm" onClick={() => { onChange(q); setOpen(false); }}>Use “{q}”</button> : "Nothing found."}
            </CommandEmpty>
            {groups.filter((g) => g.items.length).map((g) => (
              <CommandGroup key={g.heading} heading={g.heading}>
                {g.items.map((i) => (
                  <CommandItem key={i} value={i} onSelect={() => { onChange(i); setOpen(false); }}>
                    <Check className={`size-4 ${value === i ? "opacity-100" : "opacity-0"}`} />{i}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function SkillsStep({ all, skills, setSkills }: { all: { name: string; category: string }[]; skills: Skill[]; setSkills: (s: Skill[]) => void }) {
  const [q, setQ] = useState("");
  const have = new Set(skills.map((s) => s.skill));
  const add = (name: string) => { if (!have.has(name)) setSkills([...skills, { skill: name, level: "Intermediate" }]); setQ(""); };
  const grouped = useMemo(() => SKILL_CATEGORIES.map((c) => ({ c, items: all.filter((s) => s.category === c && !have.has(s.name)) })), [all, skills]);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">What are your skills?</h1>
      <p className="text-sm text-muted-foreground">Pick the skills you have and set how strong you are. These drive your match scores.</p>
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {skills.map((s, i) => (
            <span key={s.skill} className="flex items-center gap-1 rounded-full border border-primary bg-primary-soft py-1 pl-3 pr-1 text-sm font-medium text-accent-foreground">
              {s.skill}
              <select aria-label={`${s.skill} level`} value={s.level} onChange={(e) => setSkills(skills.map((x, j) => (j === i ? { ...x, level: e.target.value } : x)))}
                className="rounded-full bg-card px-1.5 py-0.5 text-xs outline-none">
                {LEVELS.map((l) => <option key={l}>{l}</option>)}
              </select>
              <button type="button" aria-label={`Remove ${s.skill}`} onClick={() => setSkills(skills.filter((_, j) => j !== i))} className="rounded-full p-1 hover:bg-card"><X className="size-3" /></button>
            </span>
          ))}
        </div>
      )}
      <Command className="rounded-xl border border-border">
        <CommandInput placeholder="Search skills, e.g. Python, CAD, RTOS" value={q} onValueChange={setQ} />
        <CommandList className="max-h-72">
          <CommandEmpty>
            {q ? <button className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm" onClick={() => add(q.trim())}><Plus className="size-4" />Add “{q}” as a custom skill</button> : "Nothing found."}
          </CommandEmpty>
          {grouped.filter((g) => g.items.length).map((g) => (
            <CommandGroup key={g.c} heading={g.c}>
              {g.items.map((s) => <CommandItem key={s.name} value={s.name} onSelect={() => add(s.name)}>{s.name}</CommandItem>)}
            </CommandGroup>
          ))}
        </CommandList>
      </Command>
    </div>
  );
}

function ExpStep({ exps, setExps }: { exps: Exp[]; setExps: (e: Exp[]) => void }) {
  const upd = (i: number, patch: Partial<Exp>) => setExps(exps.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Work experience</h1>
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/50 p-4 text-sm text-muted-foreground">
        <FileUp className="size-5 shrink-0" />CV upload with automatic pre-fill is coming soon. For now, add experience manually or skip this step.
      </div>
      {exps.map((x, i) => (
        <div key={i} className="space-y-3 rounded-xl border border-border p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="Title, e.g. Summer intern" value={x.title} onChange={(e) => upd(i, { title: e.target.value })} />
            <Input placeholder="Company" value={x.company} onChange={(e) => upd(i, { company: e.target.value })} />
            <div className="space-y-1"><Label className="text-xs">Start</Label><Input type="date" value={x.start_date} onChange={(e) => upd(i, { start_date: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-xs">End (leave empty if current)</Label><Input type="date" value={x.end_date} onChange={(e) => upd(i, { end_date: e.target.value })} /></div>
          </div>
          <Textarea placeholder="What did you do?" value={x.description} onChange={(e) => upd(i, { description: e.target.value })} />
          <Button variant="ghost" size="sm" onClick={() => setExps(exps.filter((_, j) => j !== i))}><Trash2 className="size-4" />Remove</Button>
        </div>
      ))}
      <Button variant="outline" onClick={() => setExps([...exps, { title: "", company: "", start_date: "", end_date: "", description: "" }])}><Plus className="size-4" />Add experience</Button>
    </div>
  );
}

function Multi({ label, options, value, onChange }: { label: string; options: [string, string][]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(([k, l]) => {
          const on = value.includes(k);
          return (
            <label key={k} className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${on ? "border-primary bg-primary-soft text-accent-foreground" : "border-border hover:border-primary"}`}>
              <Checkbox checked={on} onCheckedChange={(c) => onChange(c ? [...value, k] : value.filter((v) => v !== k))} className="sr-only" />
              {on && <Check className="size-3.5" />}{l}
            </label>
          );
        })}
      </div>
    </div>
  );
}
