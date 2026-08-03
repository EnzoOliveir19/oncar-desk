import { clsx, type ClassValue } from "clsx";

/** Concatena classes tailwind condicionalmente. */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Retorna os próximos N dias úteis a partir de hoje (BRT).
 * Se hoje é sábado/domingo, começa na próxima segunda.
 * Formato: 'YYYY-MM-DD'.
 */
export function getWeekdaysAhead(n = 5): string[] {
  const dates: string[] = [];
  const now = new Date();

  // Data local em BRT (offset -3), sem hora.
  const brtOffset = -3 * 60; // minutos
  const localOffset = now.getTimezoneOffset();
  const diff = brtOffset - localOffset;
  const cursor = new Date(now.getTime() - diff * 60 * 1000);
  cursor.setHours(0, 0, 0, 0);

  while (dates.length < n) {
    const day = cursor.getDay(); // 0=dom, 6=sáb
    if (day !== 0 && day !== 6) {
      const yyyy = cursor.getFullYear();
      const mm = String(cursor.getMonth() + 1).padStart(2, "0");
      const dd = String(cursor.getDate()).padStart(2, "0");
      dates.push(`${yyyy}-${mm}-${dd}`);
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

/** Formata 'YYYY-MM-DD' em label curto tipo "Seg 04". */
export function formatDayLabel(dateStr: string): { weekday: string; day: string } {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][date.getDay()];
  const day = String(d).padStart(2, "0");
  return { weekday, day };
}

/** True se a string YYYY-MM-DD é hoje em BRT. */
export function isToday(dateStr: string): boolean {
  const [y, m, d] = dateStr.split("-").map(Number);
  const today = new Date();
  return (
    today.getFullYear() === y &&
    today.getMonth() + 1 === m &&
    today.getDate() === d
  );
}
