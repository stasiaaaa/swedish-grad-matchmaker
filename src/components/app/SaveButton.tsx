import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { savedJobsQuery } from "@/lib/account";
import { useGate } from "./GatedModal";

export function SaveButton({ jobId, size = "lg", iconOnly = false }: { jobId: string; size?: "sm" | "lg" | "icon"; iconOnly?: boolean }) {
  const { user } = useAuth();
  const gate = useGate();
  const qc = useQueryClient();
  const { data: saved } = useQuery(savedJobsQuery(user?.id));
  const isSaved = !!saved?.some((s) => s.job_id === jobId);
  const key = savedJobsQuery(user?.id).queryKey;
  const m = useMutation({
    mutationFn: async (next: boolean) => {
      if (next) {
        const { error } = await supabase.from("saved_jobs").insert({ user_id: user!.id, job_id: jobId });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("saved_jobs").delete().eq("user_id", user!.id).eq("job_id", jobId);
        if (error) throw error;
      }
    },
    onSuccess: (_d, next) => {
      toast.success(next ? "Saved to My jobs" : "Removed from My jobs");
      qc.invalidateQueries({ queryKey: key });
    },
    onError: (e) => toast.error((e as Error).message),
  });
  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return gate("Create a free profile to save this job");
    m.mutate(!isSaved);
  };
  const Icon = isSaved ? BookmarkCheck : Bookmark;
  return (
    <Button size={iconOnly ? "icon" : size} variant={isSaved ? "secondary" : "outline"} onClick={onClick} disabled={m.isPending} aria-label={isSaved ? "Saved" : "Save job"}>
      <Icon className={`size-4 ${isSaved ? "fill-primary text-primary" : ""}`} />
      {!iconOnly && (isSaved ? "Saved" : "Save")}
    </Button>
  );
}
