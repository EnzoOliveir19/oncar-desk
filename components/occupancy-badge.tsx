"use client";

import { cn } from "@/lib/utils";

type Props = {
  /** Cadeiras ocupadas no dia selecionado */
  count: number;
  /** Total de cadeiras disponíveis (11 depois que a Solo NW virou hot-desk) */
  total?: number;
};

export function OccupancyBadge({ count, total = 11 }: Props) {
  const dots = Array.from({ length: total }, (_, i) => i < count);
  const isFull = count >= total;

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 px-3 py-1.5 rounded-full",
        "bg-white/[0.03] border transition-colors",
        isFull ? "border-warm/30" : "border-hairline"
      )}
      aria-label={`${count} de ${total} cadeiras ocupadas`}
    >
      {/* Dots físicos: aparecem em md+. Em mobile só mostra o fração numérica. */}
      <div className="hidden md:flex items-center gap-[3px]">
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
      {/* Bolinha única no mobile pra sinalizar estado sem ocupar 11 slots */}
      <span
        className={cn(
          "md:hidden w-1.5 h-1.5 rounded-full transition-colors duration-500",
          count === 0
            ? "bg-white/[0.08]"
            : isFull
              ? "bg-warm"
              : "bg-accent-glow"
        )}
        aria-hidden
      />
      <span className="font-mono text-xs text-text-secondary tabular-nums">
        <b className="font-medium text-text-primary">{count}</b> / {total}
      </span>
    </div>
  );
}
