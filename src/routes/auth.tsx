import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { demo, type Role } from "@/lib/demo/store";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({
    mode: z.enum(["signin", "signup"]).optional(),
    redirect: z.string().optional(),
  }),
  component: AuthPage,
});
function AuthPage() {
  const signup = Route.useSearch().mode === "signup";
  const [role, setRole] = useState<Role>("student");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const title = signup ? "Create profile" : "Log in";
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email")),
      password = String(data.get("password"));
    setBusy(true);
    setError("");
    try {
      if (signup) await demo.register(String(data.get("name")), email, password, role);
      else await demo.login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open your profile.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="mt-2 text-muted-foreground">Your LaunchPad profile is saved in this browser.</p>
      <form
        key={title}
        className="my-5 grid gap-4 rounded-2xl border bg-card p-6"
        onSubmit={submit}
      >
        {signup && (
          <>
            <fieldset>
              <legend>Profile type</legend>
              {(["student", "company"] as const).map((r) => (
                <label key={r} className="mr-4 inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="role"
                    checked={role === r}
                    onChange={() => setRole(r)}
                  />
                  {r === "company" ? "Company" : "Student"}
                </label>
              ))}
            </fieldset>
            <label>
              Name
              <Input name="name" autoComplete="name" required />
            </label>
          </>
        )}
        <label>
          Email
          <Input name="email" type="email" autoComplete="username" required />
        </label>
        <label>
          Password
          <Input
            name="password"
            type="password"
            autoComplete={signup ? "new-password" : "current-password"}
            required
          />
        </label>
        {error && (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        )}
        <Button disabled={busy}>{busy ? "Please wait…" : title}</Button>
      </form>
      <Link
        className="text-primary"
        to="/auth"
        onClick={() => setError("")}
        search={{ mode: signup ? "signin" : "signup" }}
      >
        {signup ? "Log in" : "Create profile"}
      </Link>
    </main>
  );
}
