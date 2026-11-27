import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/demo/")({ component: DemoStart });

function DemoStart() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-extrabold">Välj demovy</h1>
      <p className="mt-2 text-muted-foreground">Båda vyerna är redan inloggade. Du kan växla när som helst utan att förlora ändringar.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link to="/demo/foretag" className="rounded-2xl border border-border bg-card p-6 hover:border-primary"><Building2 className="size-6 text-primary" /><p className="mt-3 text-lg font-bold">Öppna företagsdemo</p><p className="text-sm text-muted-foreground">Östgöta Digital AB</p></Link>
        <Link to="/demo/student" className="rounded-2xl border border-border bg-card p-6 hover:border-primary"><GraduationCap className="size-6 text-primary" /><p className="mt-3 text-lg font-bold">Öppna studentdemo</p><p className="text-sm text-muted-foreground">Elsa Lind, LiU</p></Link>
      </div>
    </main>
  );
}
