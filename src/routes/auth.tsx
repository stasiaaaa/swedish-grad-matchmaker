import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { GraduationCap, Building2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ mode: z.enum(["signin", "signup"]).optional(), redirect: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Sign in or create a profile — LaunchPad" },
      { name: "description", content: "Create a free LaunchPad profile to save jobs and get personal match scores." },
      { property: "og:title", content: "Join LaunchPad" },
      { property: "og:description", content: "Free profiles for engineering students and companies in Sweden." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const safePath = (p: string | undefined) => (p && p.startsWith("/") && !p.startsWith("//") ? p : null);

function GoogleLogo() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
  );
}

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signin");
  const [type, setType] = useState<"student" | "company">("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    const target = safePath(search.redirect) ?? sessionStorage.getItem("lp_after_auth") ?? "/my-jobs";
    sessionStorage.removeItem("lp_after_auth");
    supabase.from("student_profiles").select("onboarded").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      navigate({ to: data?.onboarded || user.user_metadata?.["account_type"] === "company" ? target : "/onboarding", replace: true });
    });
  }, [user, loading, navigate, search.redirect]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: window.location.origin + "/auth", data: { account_type: type, full_name: name } },
      });
      if (error) {
        const { data } = await supabase.auth.getSession();
        if (!data.session) toast.error(error.message);
      } else setSent(true);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        // A confirmation link opened in another tab may already have signed the user in.
        const { data } = await supabase.auth.getSession();
        if (!data.session) toast.error(error.message === "Email not confirmed" ? "Please confirm your email first. Check your inbox for the link." : error.message);
      }
    }
    setBusy(false);
  };

  const google = async () => {
    const p = safePath(search.redirect);
    if (p) sessionStorage.setItem("lp_after_auth", p);
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error(r.error.message);
  };

  if (sent) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <MailCheck className="mx-auto size-12 text-primary" />
        <h1 className="mt-4 text-2xl font-extrabold">Check your email</h1>
        <p className="mt-2 text-muted-foreground">We sent a confirmation link to <strong>{email}</strong>. Click it to finish creating your profile. This page continues automatically once you're confirmed.</p>
        <Button variant="outline" className="mt-6" onClick={() => { setSent(false); setMode("signin"); }}>I've confirmed, sign in</Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card md:p-8">
        <h1 className="text-2xl font-extrabold">{mode === "signup" ? "Create your free profile" : "Welcome back"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{mode === "signup" ? "Save jobs, get match scores and track applications." : "Sign in to see your saved jobs and matches."}</p>

        {mode === "signup" && (
          <div className="mt-5 grid grid-cols-2 gap-2">
            {([["student", "I'm a student", GraduationCap], ["company", "I'm a company", Building2]] as const).map(([k, l, I]) => (
              <button key={k} type="button" onClick={() => setType(k)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-4 text-sm font-semibold transition ${type === k ? "border-primary bg-primary-soft text-accent-foreground" : "border-border hover:border-primary"}`}>
                <I className="size-5" />{l}
              </button>
            ))}
          </div>
        )}

        {(mode === "signin" || type === "student") && (
          <>
            <Button type="button" variant="outline" className="mt-5 w-full" onClick={google}><GoogleLogo />Continue with Google</Button>
            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />or with email<div className="h-px flex-1 bg-border" /></div>
          </>
        )}

        <form onSubmit={submit} className={`space-y-3 ${mode === "signup" && type === "company" ? "mt-5" : ""}`}>
          {mode === "signup" && (
            <div className="space-y-1.5"><Label htmlFor="name">{type === "company" ? "Your name" : "Full name"}</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} required /></div>
          )}
          <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div className="space-y-1.5"><Label htmlFor="pw">Password</Label><Input id="pw" type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
          <Button type="submit" className="w-full" size="lg" disabled={busy}>{busy ? "Please wait…" : mode === "signup" ? "Create profile" : "Sign in"}</Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          {mode === "signup" ? "Already have an account?" : "New to LaunchPad?"}{" "}
          <button type="button" className="font-semibold text-primary" onClick={() => setMode(mode === "signup" ? "signin" : "signup")}>
            {mode === "signup" ? "Sign in" : "Create a free profile"}
          </button>
        </p>
      </div>
    </main>
  );
}
