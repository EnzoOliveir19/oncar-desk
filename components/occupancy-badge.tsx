"use client";

import { cn } from "@/lib/utils";

type Props = {
  count: number;
  total?: number;
};

export function OccupancyBadge({ count, total = 11 }: Props) {
  const ratio = count / total;

  return (
    <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-surface/70 border border-border">
      <span
        className={cn(
          "w-2 h-2 rounded-full transition-colors duration-700",
          ratio === 0 && "bg-text-muted",
          ratio > 0 && ratio < 0.5 && "bg-accent",
          ratio >= 0.5 && ratio < 1 && "bg-accent-light",
          ratio === 1 && "bg-warm"
        )}
      />
      <span className="font-mono text-sm text-text-primary tabular-nums">
        {count}
        <span className="text-text-muted"> / {total}</span>
      </span>
    </div>
  );
}
