import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search, GraduationCap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CITIES, LOOKING_FOR } from "@/lib/domain";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LaunchPad — Thesis, internships & graduate jobs for engineers" },
      { name: "description", content: "Search Master's thesis projects, internships and graduate roles in Linköping, Stockholm and Gothenburg. No account needed." },
      { property: "og:title", content: "LaunchPad — Jobs for MSc engineering students" },
      { property: "og:description", content: "Thesis projects, internships and graduate roles in Linköping, Stockholm and Gothenburg." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  return (
    <main>
      <section className="bg-hero">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-14 md:pt-20">
          <span className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1 text-xs font-semibold text-accent-foreground shadow-card">
            <GraduationCap className="size-3.5" /> Built for LiU, KTH and Chalmers students
          </span>
          <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[1.05] md:text-6xl">
            Your first engineering job, <span className="text-primary">matched to your skills.</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            Thesis projects, internships and graduate roles in Linköping, Stockholm and Gothenburg. No account needed to browse.
          </p>
          <form
            className="mt-8 flex max-w-2xl gap-2 rounded-2xl border border-border bg-card p-2 shadow-lift"
            onSubmit={(e) => { e.preventDefault(); navigate({ to: "/jobs", search: { q: q || undefined } }); }}
          >
            <div className="flex flex-1 items-center gap-2 px-2">
              <Search className="size-5 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Try “embedded”, “thesis”, “Python”…" className="border-0 shadow-none focus-visible:ring-0" />
            </div>
            <Button type="submit" size="lg">Search</Button>
          </form>
          <div className="mt-5 flex flex-wrap gap-2">
            {CITIES.slice(0, 4).map((c) => (
              <Link key={c.key} to="/jobs" search={{ city: c.key }} className="rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium hover:border-primary hover:text-primary">
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-bold">What are you looking for?</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {LOOKING_FOR.map((l, i) => (
            <Link key={l.key} to="/jobs" search={{ lf: l.key }} className={`group rounded-2xl border p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift ${i === 0 ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>
              <p className="font-display text-lg font-bold leading-tight">{l.label}</p>
              <ArrowRight className="mt-4 size-4 transition group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
