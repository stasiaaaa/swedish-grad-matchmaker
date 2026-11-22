import { useHydrated } from "@tanstack/react-router";
import { timeAgo } from "@/lib/domain";

export function TimeAgo({ iso }: { iso: string | null | undefined }) {
  const hydrated = useHydrated();
  return <span suppressHydrationWarning>{hydrated ? timeAgo(iso) : "\u00a0"}</span>;
}
