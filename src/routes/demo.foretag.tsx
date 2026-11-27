import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Users, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CATALOG_SKILLS, norm } from "@/lib/demo/catalog";
import { matchJob } from "@/lib/demo/match";
import { DEMO_COMPANY, demo, useDemo } from "@/lib/demo/store";
import { RequirementList } from "@/components/app/DemoMatch";

export const Route = createFileRoute("/demo/foretag")({ component: CompanyView });

function CompanyView() {
  const st = useDemo();
  const mine = st.jobs.filter((j) => j.companyId === DEMO_COMPANY.id).sort((a, b) => b.createdAt - a.createdAt);
  const [open, setOpen] = useState(false);
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-3xl font-extrabold">{DEMO_COMPANY.name}</h1><p className="text-muted-foreground">{DEMO_COMPANY.city}</p></div>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link to="/demo/studenter" search={{ job: undefined }}><Users className="size-4" />Studentlista</Link></Button>
          <Button onClick={() => setOpen(true)}><Plus className="size-4" />Skapa jobbannons</Button>
        </div>
      </div>
      {open && <JobForm onDone={() => setOpen(false)} />}
      <h2 className="mt-8 text-xl font-bold">Mina annonser</h2>
      <div className="mt-3 space-y-3">
        {mine.map((j) => (
          <div key={j.id} className={`rounded-2xl border bg-card p-4 ${j.boosted ? "border-2 border-highlight" : "border-border"}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="font-bold">{j.title}</p><p className="text-sm text-muted-foreground">{j.city} · {j.requirements.join(", ")}</p></div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm font-medium"><Switch checked={j.boosted} onCheckedChange={(v) => demo.setBoost(j.id, v)} />Boosta annons</label>
                <Button size="sm" variant="outline" asChild><Link to="/demo/studenter" search={{ job: j.id }}>Se matchande studenter</Link></Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

function JobForm({ onDone }: { onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("Linköping");
  const [desc, setDesc] = useState("");
  const [reqs, setReqs] = useState<string[]>([]);
  const [tag, setTag] = useState("");
  const add = (s: string) => { const v = s.trim(); if (v && !reqs.some((r) => norm(r) === norm(v))) setReqs([...reqs, v]); setTag(""); };
  const preview = matchJob({ requirements: reqs }, { cvSkills: [], courses: [] });
  const suggestions = CATALOG_SKILLS.filter((s) => !reqs.some((r) => norm(r) === norm(s)) && (!tag || norm(s).includes(norm(tag)))).slice(0, 12);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqs.length) { toast.error("Lägg till minst ett kompetenskrav."); return; }
    demo.publish({ title, city, description: desc, requirements: reqs });
    toast.success("Annonsen är publicerad och syns nu för studenterna.");
    onDone();
  };
  return (
    <form onSubmit={submit} className="mt-6 grid gap-6 rounded-2xl border border-border bg-card p-5 md:grid-cols-2">
      <div className="space-y-3">
        <div className="space-y-1.5"><Label htmlFor="t">Jobbtitel</Label><Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
        <div className="space-y-1.5"><Label htmlFor="c">Ort</Label><Input id="c" value={city} onChange={(e) => setCity(e.target.value)} required /></div>
        <div className="space-y-1.5"><Label htmlFor="d">Beskrivning</Label><Textarea id="d" value={desc} onChange={(e) => setDesc(e.target.value)} rows={4} /></div>
        <div className="space-y-1.5">
          <Label htmlFor="r">Kompetenskrav</Label>
          <div className="flex flex-wrap gap-1.5">{reqs.map((r) => <span key={r} className="flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold">{r}<button type="button" aria-label={`Ta bort ${r}`} onClick={() => setReqs(reqs.filter((x) => x !== r))}><X className="size-3" /></button></span>)}</div>
          <Input id="r" placeholder="Skriv ett krav och tryck Enter" value={tag} onChange={(e) => setTag(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(tag); } }} />
          <div className="flex flex-wrap gap-1">{suggestions.map((s) => <button type="button" key={s} onClick={() => add(s)} className="rounded-full border border-border px-2 py-0.5 text-xs hover:border-primary">+ {s}</button>)}</div>
        </div>
        <div className="flex gap-2"><Button type="submit">Publicera annons</Button><Button type="button" variant="ghost" onClick={onDone}>Avbryt</Button></div>
      </div>
      <div>
        <p className="font-bold">Relevanta LiU-kurser</p>
        <p className="mb-2 text-xs text-muted-foreground">Föreslås automatiskt utifrån kraven.</p>
        {reqs.length ? <RequirementList m={preview} showStatus={false} /> : <p className="text-sm text-muted-foreground">Lägg till krav för att se kurser.</p>}
      </div>
    </form>
  );
}
