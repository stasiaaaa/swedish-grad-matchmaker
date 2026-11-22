import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const myProfileQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["my-profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [p, s, sk, r] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId!).maybeSingle(),
        supabase.from("student_profiles").select("*").eq("user_id", userId!).maybeSingle(),
        supabase.from("student_skills").select("skill,level").eq("user_id", userId!),
        supabase.from("user_roles").select("role").eq("user_id", userId!),
      ]);
      return {
        profile: p.data,
        student: s.data,
        skills: sk.data ?? [],
        roles: (r.data ?? []).map((x) => x.role),
      };
    },
  });

export const savedJobsQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["saved-jobs", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_jobs")
        .select("*, job:jobs(*, company:companies(id,name,slug))")
        .eq("user_id", userId!)
        .order("saved_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const followsQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["follows", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_follows")
        .select("*, company:companies(id,name,slug,industry,cities,hiring_period,is_watched)")
        .eq("user_id", userId!);
      if (error) throw error;
      return data;
    },
  });
