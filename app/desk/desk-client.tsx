"use client";

import { useState, useCallback, useTransition } from "react";
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
import { getWeekdaysAhead } from "@/lib/utils";

type Props = {
  profile: Profile;
  seats: Seat[];
  /** Reservas iniciais de todos os dias (5 dias úteis), agrupadas por data */
  initialReservations: Record<string, ReservationWithProfile[]>;
  /** Contagem por dia */
  counts: Record<string, number>;
};

export function DeskClient({
  profile,
  seats,
  initialReservations,
  counts: initialCounts,
}: Props) {
  const days = getWeekdaysAhead(5);
  const [selectedDate, setSelectedDate] = useState(days[0]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { reservations } = useReservations(
    initialReservations[selectedDate] ?? [],
    selectedDate
  );

  // Contagens em tempo real (recalcula a partir dos dados do dia selecionado)
  const liveCounts: Record<string, number> = { ...initialCounts };
  liveCounts[selectedDate] = reservations.length;

  const myReservation = reservations.find(
    (r) => r.user_id === profile.id
  );

  const handleSeatClick = useCallback(
    (seatId: number) => {
      setError(null);

      // Se já reservei esse dia, clicou na cadeira dele → cancelar
      if (myReservation) {
        if (myReservation.seat_id !== seatId) {
          setError("Você já reservou outra cadeira nesse dia. Cancele primeiro.");
          return;
        }
        // Cancelar minha reserva
        startTransition(async () => {
          const result = await cancelReservation(selectedDate);
          if (result.error) setError(result.error);
        });
        return;
      }

      // Reservar
      startTransition(async () => {
        const result = await reserveSeat(seatId, selectedDate);
        if (result.error) setError(result.error);
      });
    },
    [myReservation, selectedDate]
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ─────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 py-3 sm:px-8 sm:py-4">
        <div className="flex items-center gap-4 sm:gap-6">
          <span className="font-mono text-[11px] tracking-[0.25em] text-text-muted uppercase">
            Oncar Desk
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
        <div className="flex items-center gap-4">
          <OccupancyBadge count={reservations.length} />
          <UserMenu profile={profile} />
        </div>
      </header>

      {/* ── Erro (se houver) ───────────────────────────── */}
      {error && (
        <div className="mx-auto px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* ── Mapa ───────────────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center px-4 pb-4">
        <OfficeMap
          seats={seats}
          reservations={reservations}
          currentUserId={profile.id}
          onSeatClick={handleSeatClick}
          disabled={isPending}
        />
      </main>

      {/* ── Footer minimal ─────────────────────────────── */}
      {myReservation && (
        <footer className="text-center pb-4">
          <span className="text-xs text-text-muted">
            Sua cadeira:{" "}
            <span className="text-text-secondary font-mono">
              {seats.find((s) => s.id === myReservation.seat_id)?.label ?? myReservation.seat_id}
            </span>
            {" · "}
            <button
              onClick={() => handleSeatClick(myReservation.seat_id)}
              disabled={isPending}
              className="text-accent hover:text-accent-light transition-colors"
            >
              cancelar
            </button>
          </span>
        </footer>
      )}
    </div>
  );
}
