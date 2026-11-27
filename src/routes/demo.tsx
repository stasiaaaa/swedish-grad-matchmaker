import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Building2, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/demo")({
  ssr: false,
  head: () => ({ meta: [
    { title: "Demo — LaunchPad" },
    { name: "description", content: "Prova LaunchPad som företag eller student med exempeldata." },
    { property: "og:title", content: "LaunchPad-demo" },
    { property: "og:description", content: "Publicera ett jobb som företag och se direkt hur det matchar en LiU-student." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: DemoLayout,
});

const tab = "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-secondary";
function DemoLayout() {
  return (
    <div>
      <div className="border-b border-border bg-primary-soft/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2">
          <span className="text-sm font-semibold">Demoläge · exempeldata sparas i webbläsaren</span>
          <nav className="flex gap-1">
            <Link to="/demo/foretag" className={tab} activeProps={{ className: "bg-background text-foreground shadow-sm" }}><Building2 className="size-4" />Företagsvy</Link>
            <Link to="/demo/student" className={tab} activeProps={{ className: "bg-background text-foreground shadow-sm" }}><GraduationCap className="size-4" />Studentvy</Link>
          </nav>
        </div>
      </div>
      <Outlet />
    </div>
  );
}
