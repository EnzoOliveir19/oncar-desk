"use client";

import { cn } from "@/lib/utils";

type Props = {
  /** Contagem de HOT-DESKS ocupadas (Gustavo não conta, ele é fixo) */
  count: number;
  /** Total de hot-desks disponíveis */
  total?: number;
};

export function OccupancyBadge({ count, total = 10 }: Props) {
  const dots = Array.from({ length: total }, (_, i) => i < count);
  const isFull = count >= total;

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 px-3.5 py-1.5 rounded-full",
        "bg-white/[0.03] border transition-colors",
        isFull ? "border-warm/30" : "border-hairline"
      )}
      aria-label={`${count} de ${total} hot-desks ocupadas`}
    >
      <div className="flex items-center gap-[3px]">
        {dots.map((on, i) => (
          <span
            key={i}
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-colors duration-500",
              on
                ? isFull
                  ? "bg-warm"
                  : "bg-accent-glow"
                : "bg-white/[0.08]"
            )}
          />
        ))}
      </div>
      <span className="font-mono text-xs text-text-secondary tabular-nums">
        <b className="font-medium text-text-primary">{count}</b> / {total}
      </span>
    </div>
  );
}
