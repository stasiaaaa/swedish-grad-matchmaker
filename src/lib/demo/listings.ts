import { useQuery } from "@tanstack/react-query";
import { jobsQuery, type JobRow } from "@/lib/queries";
import { type DemoJob } from "./match";
import { useDemo } from "./store";

export function publicListing(row: JobRow): DemoJob {
  return {
    id: row.id,
    companyId: row.company_id,
    company: row.company?.name ?? "",
    title: row.title,
    city: row.location_label || row.company?.city || "",
    description: row.summary || row.description || "",
    requirements: row.required_skills ?? [],
    boosted: false,
    createdAt: Date.parse(row.posted_at || row.last_seen_at),
    sourceUrl: row.source_url || undefined,
  };
}
export function useListings() {
  const state = useDemo();
  const imported = useQuery({ ...jobsQuery(), retry: false, staleTime: 60000 });
  return [...state.jobs, ...(imported.data || []).map(publicListing)];
}
