import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const JOB_SELECT = "*, company:companies(id,name,slug,industry,city,website,careers_url,description)";

export type JobFilters = {
  q?: string | undefined;
  lf?: string | undefined;
  role?: string | undefined;
  city?: string | undefined;
  mode?: string | undefined;
  company?: string | undefined;
  skill?: string | undefined;
};

export const jobsQuery = () =>
  queryOptions({
    queryKey: ["jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select(JOB_SELECT)
        .eq("status", "open")
        .order("posted_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
export type JobRow = Awaited<ReturnType<NonNullable<ReturnType<typeof jobsQuery>["queryFn"]>>>[number];

export function filterJobs(jobs: JobRow[], f: JobFilters) {
  const q = f.q?.toLowerCase().trim();
  return jobs.filter((j) => {
    if (f.lf && j.looking_for !== f.lf) return false;
    if (f.role && j.role_type !== f.role) return false;
    if (f.city && j.city !== f.city) return false;
    if (f.mode && j.work_mode !== f.mode) return false;
    if (f.company && j.company?.slug !== f.company) return false;
    if (f.skill && ![...j.required_skills, ...j.nice_skills].includes(f.skill)) return false;
    if (q) {
      const hay = [j.title, j.summary, j.company?.name, j.location_label, j.role_type, ...j.required_skills]
        .join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export const jobQuery = (id: string) =>
  queryOptions({
    queryKey: ["job", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("jobs").select(JOB_SELECT).eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const companyQuery = (slug: string) =>
  queryOptions({
    queryKey: ["company", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*, jobs(id,title,looking_for,role_type,city,location_label,work_mode,posted_at,status)")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const skillNamesQuery = () =>
  queryOptions({
    queryKey: ["skills"],
    queryFn: async () => {
      const { data, error } = await supabase.from("skills").select("name,category").order("name");
      if (error) throw error;
      return data;
    },
  });

export const watchedCompaniesQuery = () =>
  queryOptions({
    queryKey: ["watched-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id,name,slug,industry,city,cities,typical_roles,hiring_period,watch_note,last_posting_at,careers_url,lat,lng")
        .eq("is_watched", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });
