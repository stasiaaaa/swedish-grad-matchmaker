import { cn } from "@/lib/utils";

export function CompanyLogo({ name, className }: { name: string; className?: string }) {
  const initials = name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div
      aria-hidden
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft font-display text-sm font-bold text-accent-foreground",
        className,
      )}
    >
      {initials}
    </div>
  );
}
