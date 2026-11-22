import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { timeAgo } from "@/lib/domain";

export function NotificationBell({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const key = ["notifications", userId];
  const { data = [] } = useQuery({
    queryKey: key,
    queryFn: async () => (await supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20)).data ?? [],
    refetchInterval: 120_000,
  });
  const unread = data.filter((n) => !n.read_at).length;
  const markRead = useMutation({
    mutationFn: async () => { await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", userId).is("read_at", null); },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });
  return (
    <Popover onOpenChange={(o) => { if (!o && unread) markRead.mutate(); }}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Notifications${unread ? ` (${unread} new)` : ""}`} className="relative">
          <Bell className="size-5" />
          {unread > 0 && <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{unread}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="z-[1100] w-80 p-0">
        <div className="border-b border-border px-4 py-2 text-sm font-semibold">Notifications</div>
        {data.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">Nothing yet. Press "Notify me" on a company to hear when they post.</p>
        ) : (
          <ul className="max-h-96 overflow-auto">
            {data.map((n) => (
              <li key={n.id} className={`border-b border-border/60 px-4 py-3 text-sm last:border-0 ${n.read_at ? "" : "bg-primary-soft/50"}`}>
                {n.job_id ? <Link to="/jobs/$id" params={{ id: n.job_id }} className="font-medium hover:underline">{n.title}</Link> : <span className="font-medium">{n.title}</span>}
                {n.body && <p className="mt-0.5 line-clamp-2 text-muted-foreground">{n.body}</p>}
                <p className="mt-1 text-xs text-muted-foreground">{timeAgo(n.created_at)}</p>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
