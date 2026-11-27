import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { NotificationBell } from "./NotificationBell";
import { myProfileQuery } from "@/lib/account";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { currentAccount, demo, homeFor, useDemo } from "@/lib/demo/store";

export function SiteHeader() {
  const account = currentAccount(useDemo());
  const navigate = useNavigate();
  const { user } = useAuth();
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link
          to={account ? homeFor(account.role) : "/"}
          className="flex items-center gap-2 font-display text-xl font-bold"
        >
          <Rocket className="text-primary" />
          LaunchPad
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm font-medium">
          {!account && user ? (
            <LegacyNavigation userId={user.id} />
          ) : account?.role === "company" ? (
            <>
              <Link to="/demo/foretag">Company dashboard</Link>
              <Link to="/demo/foretag" search={{ cart: true }}>
                Cart ({account.cart.length})
              </Link>
            </>
          ) : account ? (
            <>
              <Link to="/demo/student">Find jobs</Link>
              <Link to="/demo/student" search={{ view: "tracked" }}>
                My jobs
              </Link>
              <Link to="/demo/student" search={{ view: "profile" }}>
                Edit profile
              </Link>
            </>
          ) : (
            <>
              <Link to="/jobs">Find jobs</Link>
              <Link to="/watching">Watching</Link>
              <Link to="/auth" search={{ mode: "signup" }}>
                Create profile
              </Link>
              <Link to="/auth" search={{ mode: "signin" }}>
                Log in
              </Link>
            </>
          )}
          {account && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                demo.logout();
                void navigate({ to: "/auth", replace: true });
              }}
            >
              Log out
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
function LegacyNavigation({ userId }: { userId: string }) {
  const { data: profile } = useQuery(myProfileQuery(userId));
  const qc = useQueryClient();
  const navigate = useNavigate();
  return (
    <>
      <Link to="/jobs">Find jobs</Link>
      <Link to="/watching">Watching</Link>
      <Link to="/onboarding">Edit profile</Link>
      <Link to="/my-jobs">My jobs</Link>
      {profile?.roles.includes("admin") && <Link to="/admin">Admin</Link>}
      <NotificationBell userId={userId} />
      <Button
        variant="outline"
        size="sm"
        onClick={async () => {
          await qc.cancelQueries();
          await supabase.auth.signOut();
          qc.clear();
          await navigate({ to: "/auth", replace: true });
        }}
      >
        Log out
      </Button>
    </>
  );
}
