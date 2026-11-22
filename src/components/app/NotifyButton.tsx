import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BellRing } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { followsQuery } from "@/lib/account";
import { useGate } from "./GatedModal";

export function NotifyButton({ companyId }: { companyId: string }) {
  const { user } = useAuth();
  const gate = useGate();
  const qc = useQueryClient();
  const { data: follows } = useQuery(followsQuery(user?.id));
  const on = !!follows?.some((f) => f.company_id === companyId);
  const m = useMutation({
    mutationFn: async () => {
      const r = on
        ? await supabase.from("company_follows").delete().eq("user_id", user!.id).eq("company_id", companyId)
        : await supabase.from("company_follows").insert({ user_id: user!.id, company_id: companyId });
      if (r.error) throw r.error;
    },
    onSuccess: () => { toast.success(on ? "Stopped watching" : "We'll notify you when they post"); qc.invalidateQueries({ queryKey: followsQuery(user?.id).queryKey }); },
    onError: (e) => toast.error((e as Error).message),
  });
  return (
    <Button className="flex-1" variant={on ? "secondary" : "default"} disabled={m.isPending}
      onClick={() => (user ? m.mutate() : gate("Create a free profile to get notified"))}>
      {on ? <BellRing className="size-4" /> : <Bell className="size-4" />}{on ? "Notifying you" : "Notify me"}
    </Button>
  );
}
