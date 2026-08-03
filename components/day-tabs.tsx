"use client";

import { cn } from "@/lib/utils";
import { formatDayLabel, isToday } from "@/lib/utils";

type Props = {
  days: string[];
  selected: string;
  onSelect: (date: string) => void;
  /** Contagem de reservas por dia: { 'YYYY-MM-DD': number } */
  counts: Record<string, number>;
};

export function DayTabs({ days, selected, onSelect, counts }: Props) {
  return (
    <nav className="flex items-center gap-1">
      {days.map((date) => {
        const { weekday, day } = formatDayLabel(date);
        const isActive = date === selected;
        const today = isToday(date);
        const count = counts[date] ?? 0;

        return (
          <button
            key={date}
            onClick={() => onSelect(date)}
            className={cn(
              "relative flex flex-col items-center px-4 py-2 rounded-lg transition-all duration-200",
              "hover:bg-surface/60",
              isActive
                ? "bg-surface text-text-primary"
                : "text-text-muted"
            )}
          >
            <span className="text-[11px] font-medium uppercase tracking-wider">
              {weekday}
            </span>
            <span
              className={cn(
                "font-mono text-lg leading-tight",
                isActive ? "text-text-primary" : "text-text-secondary"
              )}
            >
              {day}
            </span>

            {/* Dot indicador: hoje = accent, outros dias com reserva = muted */}
            {today && (
              <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-accent" />
            )}

            {/* Mini contador quando não é a aba ativa */}
            {!isActive && count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-surface text-[9px] font-mono text-text-muted">
                {count}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
