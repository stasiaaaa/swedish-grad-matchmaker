import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Users, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea";
import { CATALOG_SKILLS, norm } from "@/lib/demo/catalog";
import { matchJob } from "@/lib/demo/match";
import { currentAccount, demo, useDemo } from "@/lib/demo/store";
import { RequirementList } from "@/components/app/DemoMatch";

export const Route = createFileRoute("/demo/foretag")({
  validateSearch: z.object({ cart: z.boolean().optional() }),
  component: CompanyView,
});

function CompanyView() {
  const st = useDemo();
  const account = currentAccount(st)!;
  const cart = Route.useSearch().cart;
  const [open, setOpen] = useState(false);
  if (account?.role !== "company") return null;
  const mine = st.jobs
    .filter((j) => j.companyId === account.id)
    .sort((a, b) => b.createdAt - a.createdAt);
  if (cart)
    return (
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-8">
        <h1 className="text-3xl font-bold">Boost cart</h1>
        <p>
          Simulated checkout. Each purchase boosts one listing for students who match more than 25%
          of its requirements.
        </p>
        {mine
          .filter((j) => account.cart.includes(j.id))
          .map((j) => (
            <div key={j.id} className="flex items-center justify-between rounded-xl border p-4">
              {j.title}
              <Button variant="ghost" onClick={() => demo.cart(j.id, false)}>
                Remove
              </Button>
            </div>
          ))}
        {!account.cart.length && <p>Your cart is empty.</p>}
        <Button
          disabled={!account.cart.length}
          onClick={() => {
            demo.pay();
            toast.success("Payment complete. Your listings are boosted.");
          }}
        >
          Pay
        </Button>
      </main>
    );
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">{account.name}</h1>
          <p className="text-muted-foreground">Company dashboard</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/demo/studenter" search={{ job: undefined }}>
              <Users className="size-4" />
              Find students
            </Link>
          </Button>
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            Create job listing
          </Button>
        </div>
      </div>
      {open && <JobForm onDone={() => setOpen(false)} />}
      <h2 className="mt-8 text-xl font-bold">My listings</h2>
      <div className="mt-3 space-y-3">
        {mine.map((j) => (
          <div
            key={j.id}
            className={`rounded-2xl border bg-card p-4 ${j.boosted ? "border-2 border-highlight" : "border-border"}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-bold">{j.title}</p>
                <p className="text-sm text-muted-foreground">
                  {j.city} · {j.requirements.join(", ")}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={j.boosted || account.cart.includes(j.id)}
                  onClick={() => demo.cart(j.id, true)}
                >
                  {j.boosted
                    ? "Boost purchased"
                    : account.cart.includes(j.id)
                      ? "In cart"
                      : "Boost listing"}
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link to="/demo/studenter" search={{ job: j.id }}>
                    Find matching students
                  </Link>
                </Button>
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
  const [sourceUrl, setSourceUrl] = useState("");
  const [desc, setDesc] = useState("");
  const [reqs, setReqs] = useState<string[]>([]);
  const [tag, setTag] = useState("");
  const add = (s: string) => {
    const v = s.trim();
    if (v && !reqs.some((r) => norm(r) === norm(v))) setReqs([...reqs, v]);
    setTag("");
  };
  const preview = matchJob({ requirements: reqs }, { cvSkills: [], courses: [] });
  const suggestions = CATALOG_SKILLS.filter(
    (s) => !reqs.some((r) => norm(r) === norm(s)) && (!tag || norm(s).includes(norm(tag))),
  ).slice(0, 12);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqs.length) {
      toast.error("Add at least one skill requirement.");
      return;
    }
    demo.publish({ sourceUrl, title, city, description: desc, requirements: reqs });
    toast.success("Listing published. Students can now find it in their feed.");
    onDone();
  };
  return (
    <form
      onSubmit={submit}
      className="mt-6 grid gap-6 rounded-2xl border border-border bg-card p-5 md:grid-cols-2"
    >
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="t">Job title</Label>
          <Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c">City</Label>
          <Input id="c" value={city} onChange={(e) => setCity(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="apply">Application URL</Label>
          <Input
            id="apply"
            type="url"
            pattern="https?://.+"
            placeholder="https://company.com/careers"
            value={sourceUrl}
            required
            onChange={(e) => setSourceUrl(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="d">Description</Label>
          <Textarea id="d" value={desc} onChange={(e) => setDesc(e.target.value)} rows={4} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="r">Skill requirements</Label>
          <div className="flex flex-wrap gap-1.5">
            {reqs.map((r) => (
              <span
                key={r}
                className="flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold"
              >
                {r}
                <button
                  type="button"
                  aria-label={`Remove ${r}`}
                  onClick={() => setReqs(reqs.filter((x) => x !== r))}
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
          <Input
            id="r"
            placeholder="Enter a skill and press Enter"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add(tag);
              }
            }}
          />
          <Button type="button" variant="outline" disabled={!tag.trim()} onClick={() => add(tag)}>
            Add skill
          </Button>
          <div className="flex flex-wrap gap-1">
            {suggestions.map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => add(s)}
                className="rounded-full border border-border px-2 py-0.5 text-xs hover:border-primary"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="submit">Publish listing</Button>
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        </div>
      </div>
      <div>
        <p className="font-bold">Relevant LiU courses</p>
        <p className="mb-2 text-xs text-muted-foreground">
          Suggested from your skill requirements.
        </p>
        {reqs.length ? (
          <RequirementList m={preview} showStatus={false} />
        ) : (
          <p className="text-sm text-muted-foreground">Add a skill to see suggested courses.</p>
        )}
      </div>
    </form>
  );
}
