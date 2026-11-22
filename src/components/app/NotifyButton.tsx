import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BellRing } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { followsQuery } from "@/lib/account";
import { subscribeGuest } from "@/lib/notify.functions";

export function NotifyButton({ companyId, companyName }: { companyId: string; companyName?: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [hp, setHp] = useState("");
  const [done, setDone] = useState(false);
  const { data: follows } = useQuery(followsQuery(user?.id));
  const on = !!follows?.some((f) => f.company_id === companyId) || done;
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
  const g = useMutation({
    mutationFn: async () => {
      const r = await subscribeGuest({ data: { email, companyId, consent: true, ...(hp ? { website: hp } : {}) } });
      if (!r.ok) throw new Error(r.error);
    },
    onSuccess: () => { setDone(true); setOpen(false); toast.success("Done! We'll email you when they post a new role."); },
    onError: (e) => toast.error((e as Error).message),
  });
  return (
    <>
      <Button className="flex-1" variant={on ? "secondary" : "default"} disabled={m.isPending || (!user && done)}
        onClick={() => (user ? m.mutate() : setOpen(true))}>
        {on ? <BellRing className="size-4" /> : <Bell className="size-4" />}{on ? "Notifying you" : "Notify me"}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Get notified{companyName ? ` about ${companyName}` : ""}</DialogTitle>
            <DialogDescription>We'll send one short email when they post a new role. No marketing, unsubscribe any time.</DialogDescription>
          </DialogHeader>
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); g.mutate(); }}>
            <Input type="email" required placeholder="you@student.liu.se" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
            <input tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} className="hidden" aria-hidden />
            <label className="flex items-start gap-2 text-sm">
              <Checkbox checked={consent} onCheckedChange={(c) => setConsent(!!c)} className="mt-0.5" />
              <span>I agree that LaunchPad emails me when this company posts a new job.</span>
            </label>
            <Button type="submit" className="w-full" disabled={!consent || g.isPending}>Notify me</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
