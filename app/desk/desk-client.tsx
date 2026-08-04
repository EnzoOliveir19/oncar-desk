"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { OfficeMap } from "@/components/office-map";
import { DayTabs } from "@/components/day-tabs";
import { UserMenu } from "@/components/user-menu";
import { OccupancyBadge } from "@/components/occupancy-badge";
import {
  useReservations,
  type ReservationWithProfile,
} from "@/lib/hooks/use-reservations";
import { reserveSeat, cancelReservation } from "./actions";
import type { Seat, Profile } from "@/lib/types";
import { cn, getWeekdaysAhead } from "@/lib/utils";

type Props = {
  profile: Profile;
  seats: Seat[];
  initialReservations: Record<string, ReservationWithProfile[]>;
  counts: Record<string, number>;
};

export function DeskClient({
  profile,
  seats,
  initialReservations,
  counts: initialCounts,
}: Props) {
  const router = useRouter();
  const days = getWeekdaysAhead(5);
  const [selectedDate, setSelectedDate] = useState(days[0]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [hintDismissed, setHintDismissed] = useState(false);

  // Snapshot do "hoje" no mount pra detectar virada de dia
  const mountedTodayRef = useRef(days[0]);

  const { reservations } = useReservations(
    initialReservations[selectedDate] ?? [],
    selectedDate
  );

  const myReservation = reservations.find((r) => r.user_id === profile.id);

  // Contagens em tempo real: hot-desks (exclui seat_id=1 do Gustavo)
  const liveCounts: Record<string, number> = { ...initialCounts };
  liveCounts[selectedDate] = reservations.length;
  const hotDeskCount = reservations.filter((r) => r.seat_id !== 1).length;

  // ── Cursor parallax no mapa (respeita reduced-motion) ─────────
  const mapWrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mql.matches) return;

    let raf = 0;
    let tx = 0,
      ty = 0;
    function onMove(e: MouseEvent) {
      const dx = (e.clientX / window.innerWidth - 0.5) * -8;
      const dy = (e.clientY / window.innerHeight - 0.5) * -6;
      // Lerp suave
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        tx = tx + (dx - tx) * 0.15;
        ty = ty + (dy - ty) * 0.15;
        if (mapWrapRef.current) {
          mapWrapRef.current.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0)`;
        }
      });
    }
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  // ── Hint inicial (mostra por 8s no primeiro carregamento) ─────
  useEffect(() => {
    const t = setTimeout(() => setHintDismissed(true), 8500);
    return () => clearTimeout(t);
  }, []);

  // ── Auto-refresh na virada de dia ────────────────────────────
  // Se a aba ficou aberta durante a madrugada, ao voltar (visibilitychange)
  // ou focar a janela a gente detecta que "hoje" mudou e faz router.refresh()
  // pra re-fetchar as reservas com o novo intervalo de datas.
  useEffect(() => {
    function checkDayRollover() {
      if (typeof document === "undefined") return;
      if (document.visibilityState !== "visible") return;
      const currentToday = getWeekdaysAhead(1)[0];
      if (currentToday !== mountedTodayRef.current) {
        mountedTodayRef.current = currentToday;
        setSelectedDate(currentToday); // volta pro dia atual
        setError(null);
        router.refresh();
      }
    }
    document.addEventListener("visibilitychange", checkDayRollover);
    window.addEventListener("focus", checkDayRollover);
    return () => {
      document.removeEventListener("visibilitychange", checkDayRollover);
      window.removeEventListener("focus", checkDayRollover);
    };
  }, [router]);

  const handleSeatClick = useCallback(
    (seatId: number) => {
      setError(null);
      setHintDismissed(true);

      if (myReservation) {
        if (myReservation.seat_id !== seatId) {
          setError("Você já reservou outra cadeira nesse dia. Cancele primeiro.");
          return;
        }
        startTransition(async () => {
          const result = await cancelReservation(selectedDate);
          if (result.error) setError(result.error);
        });
        return;
      }

      startTransition(async () => {
        const result = await reserveSeat(seatId, selectedDate);
        if (result.error) setError(result.error);
      });
    },
    [myReservation, selectedDate]
  );

  const seatLabel = myReservation
    ? seats.find((s) => s.id === myReservation.seat_id)?.label ??
      `Cadeira ${myReservation.seat_id}`
    : null;

  return (
    <div className="stage-vignette relative min-h-screen flex flex-col">
      {/* Grain overlay */}
      <div className="grain-overlay" aria-hidden />

      {/* ── Chrome ─────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-3.5 bg-gradient-to-b from-canvas/75 via-canvas/40 to-transparent backdrop-blur-md">
        <div className="flex items-center gap-6">
          <span className="font-mono text-[11px] tracking-[0.25em] text-text-secondary uppercase pr-5 border-r border-hairline">
            <b className="font-medium text-text-primary">Oncar</b>&nbsp;Desk
          </span>
          <DayTabs
            days={days}
            selected={selectedDate}
            onSelect={(d) => {
              setSelectedDate(d);
              setError(null);
            }}
            counts={liveCounts}
          />
        </div>
        <div className="flex items-center gap-5">
          <OccupancyBadge count={hotDeskCount} total={10} />
          <UserMenu profile={profile} />
        </div>
      </header>

      {/* ── Erro ────────────────────────────────────────── */}
      {error && (
        <div
          role="alert"
          className="fixed top-20 left-1/2 -translate-x-1/2 z-20 max-w-md px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm font-medium backdrop-blur-md animate-slideUpFade"
        >
          {error}
        </div>
      )}

      {/* ── Mapa ────────────────────────────────────────── */}
      <main className="relative z-[2] flex-1 grid place-items-center">
        <div
          ref={mapWrapRef}
          className="w-[min(1200px,96vw)] aspect-[12/8] will-change-transform transition-transform duration-500 ease-out"
        >
          <OfficeMap
            seats={seats}
            reservations={reservations}
            currentUserId={profile.id}
            onSeatClick={handleSeatClick}
            disabled={isPending}
          />
        </div>
      </main>

      {/* ── Hint inicial ────────────────────────────────── */}
      {!hintDismissed && !myReservation && (
        <div
          className={cn(
            "fixed left-6 bottom-6 z-[12] max-w-[280px] px-3.5 py-2.5",
            "bg-canvas/70 border border-hairline rounded-xl backdrop-blur-md",
            "text-xs text-text-secondary leading-relaxed animate-slideUpFade"
          )}
          aria-live="polite"
        >
          <b className="font-medium text-text-primary">Passe o mouse</b> nas
          cadeiras livres. <b className="font-medium text-text-primary">Clique</b>{" "}
          pra reservar.
        </div>
      )}

      {/* ── Pill inferior: sua reserva ──────────────────── */}
      {myReservation && seatLabel && (
        <footer
          className={cn(
            "fixed left-1/2 -translate-x-1/2 bottom-6 z-[15]",
            "flex items-center gap-3.5 pl-4 pr-1.5 py-1.5",
            "bg-canvas/70 border border-hairline-strong rounded-full",
            "backdrop-blur-lg animate-slideUpFade"
          )}
        >
          <span className="font-mono text-[13px] text-text-secondary">
            Sua cadeira{" "}
            <span className="text-text-primary font-medium">{seatLabel}</span>
          </span>
          <button
            onClick={() => handleSeatClick(myReservation.seat_id)}
            disabled={isPending}
            className={cn(
              "px-3.5 py-1.5 rounded-full font-mono text-xs font-medium",
              "bg-accent/15 border border-accent/30 text-accent-glow",
              "hover:bg-accent/25 hover:border-accent/50 transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            cancelar
          </button>
        </footer>
      )}
    </div>
  );
}
