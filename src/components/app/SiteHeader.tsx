import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Rocket, LogOut, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { myProfileQuery } from "@/lib/account";
import { NotificationBell } from "./NotificationBell";

const linkCls = "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground";

export function SiteHeader() {
  const { user, loading } = useAuth();
  const isDemo = useLocation({select: location => location.pathname === "/demo"});
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: me } = useQuery(myProfileQuery(user?.id));
  const isAdmin = !!me?.roles.includes("admin");
  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
  return (
    <header className="sticky top-0 z-[1000] border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Rocket className="size-4" /></span>
          <span className="hidden sm:inline">LaunchPad</span>
        </Link>
        {isDemo ? <Link className={linkCls} to="/">Avsluta demo</Link> : <nav className="flex items-center gap-1">
          <Link to="/jobs" className={linkCls} activeProps={{ className: "bg-secondary text-foreground" }}>Find jobs</Link>
          <Link to="/watching" className={linkCls} activeProps={{ className: "bg-secondary text-foreground" }}>Watching</Link>
          {user && <Link to="/my-jobs" className={linkCls} activeProps={{ className: "bg-secondary text-foreground" }}>My jobs</Link>}
          {!loading && !user && (
            <Button asChild size="sm" className="ml-1"><Link to="/auth" search={{ mode: "signup" }}>Create profile</Link></Button>
          )}
          {isAdmin && <Link to="/admin" className={linkCls} activeProps={{ className: "bg-secondary text-foreground" }}>Admin</Link>}
          {user && <NotificationBell userId={user.id} />}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Account"><UserRound className="size-5" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-2 py-1.5 text-xs text-muted-foreground">{user.email}</div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/onboarding">Edit profile</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/my-jobs">My jobs</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}><LogOut className="size-4" />Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>}
      </div>
    </header>
  );
}
