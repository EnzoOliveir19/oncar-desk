"use client";

import { cn, formatDayLabel, isToday } from "@/lib/utils";

type Props = {
  days: string[];
  selected: string;
  onSelect: (date: string) => void;
  counts: Record<string, number>;
};

export function DayTabs({ days, selected, onSelect, counts }: Props) {
  return (
    <nav className="flex items-center gap-1" role="tablist">
      {days.map((date) => {
        const { weekday, day } = formatDayLabel(date);
        const isActive = date === selected;
        const today = isToday(date);
        const count = counts[date] ?? 0;

        return (
          <button
            key={date}
            role="tab"
            aria-selected={isActive}
            aria-label={`${weekday} dia ${day}${count > 0 ? `, ${count} reservas` : ""}`}
            onClick={() => onSelect(date)}
            className={cn(
              "relative flex flex-col items-center gap-0.5 px-3 py-1.5 pb-2 rounded-[10px]",
              "min-w-[46px] transition-colors duration-200",
              "border",
              isActive
                ? "bg-accent/10 border-accent/30"
                : "bg-transparent border-transparent hover:bg-hairline"
            )}
          >
            <span
              className={cn(
                "font-mono text-[11px] font-medium uppercase tracking-[0.15em]",
                isActive ? "text-accent-glow" : "text-text-secondary"
              )}
            >
              {weekday}
            </span>
            <span
              className={cn(
                "font-mono text-base font-medium leading-none tabular-nums",
                isActive ? "text-text-primary" : "text-text-secondary"
              )}
            >
              {day}
            </span>
            {/* Dot: ativo = accent-glow. Hoje sem estar ativo = accent muted. */}
            <span
              className={cn(
                "h-1 w-1 rounded-full transition-colors",
                isActive
                  ? "bg-accent-glow"
                  : today
                    ? "bg-accent/50"
                    : "bg-transparent"
              )}
            />
            {/* Badge de contagem quando não é a aba ativa */}
            {!isActive && count > 0 && (
              <span
                aria-hidden
                className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-1 flex items-center justify-center rounded-full bg-surface-dark border border-hairline text-[9px] font-mono text-text-secondary tabular-nums"
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
