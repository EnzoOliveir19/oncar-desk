"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Reservation, Profile } from "@/lib/types";

export type ReservationWithProfile = Reservation & {
  profiles: Pick<Profile, "id" | "full_name" | "avatar_url" | "email"> | null;
};

type ByDay = Record<string, ReservationWithProfile[]>;

/**
 * Fonte da verdade única pras reservas: um cache POR DIA no cliente.
 *
 * Por que não confiar no prop `initialByDay` a cada troca de dia?
 *   Porque ele é um snapshot congelado do SSR. Se a gente reseta o estado
 *   pra ele toda vez que troca de dia, joga fora as mudanças otimistas e
 *   as do realtime — fazendo reservas canceladas ressuscitarem e reservas
 *   novas sumirem ao alternar entre dias.
 *
 * Solução: `initialByDay` só semeia o cache no primeiro render. Depois disso,
 * o cache (`byDay`) é mutado por:
 *   - updates otimistas (clique do usuário — instantâneo)
 *   - realtime (confirma/reconcilia com o banco)
 *   - refetch ao trocar de dia (mantém o dia visitado fresco)
 */
export function useReservations(initialByDay: ByDay, selectedDate: string) {
  const [byDay, setByDay] = useState<ByDay>(initialByDay);

  const selectedRef = useRef(selectedDate);
  selectedRef.current = selectedDate;

  const reservations = byDay[selectedDate] ?? [];

  const fetchDay = useCallback(async (date: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("reservations")
      .select("*, profiles(id, full_name, avatar_url, email)")
      .eq("date", date);

    if (data) {
      setByDay((prev) => ({
        ...prev,
        [date]: data as ReservationWithProfile[],
      }));
    }
  }, []);

  // Ao trocar de dia, refetch fresco daquele dia (mantém o cache correto).
  // Enquanto o fetch não volta, a UI mostra o cache existente (sem flash).
  useEffect(() => {
    fetchDay(selectedDate);
  }, [selectedDate, fetchDay]);

  // Realtime só do dia selecionado
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`reservations:${selectedDate}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reservations",
          filter: `date=eq.${selectedDate}`,
        },
        () => {
          // Reconcilia o cache do dia com o estado real do banco
          if (selectedRef.current === selectedDate) {
            fetchDay(selectedDate);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedDate, fetchDay]);

  return {
    reservations,
    reservationsByDay: byDay,

    /**
     * Reserva otimista: insere no cache do dia na hora. Se já havia reserva
     * minha nesse dia, troca de cadeira.
     */
    applyReserveOptimistic: (
      seatId: number,
      me: Pick<Profile, "id" | "full_name" | "avatar_url" | "email">
    ) => {
      setByDay((prev) => {
        const day = (prev[selectedDate] ?? []).filter(
          (r) => r.user_id !== me.id
        );
        const optimistic: ReservationWithProfile = {
          id: `optimistic-${seatId}-${selectedDate}`,
          user_id: me.id,
          seat_id: seatId,
          date: selectedDate,
          created_at: new Date().toISOString(),
          profiles: me,
        };
        return { ...prev, [selectedDate]: [...day, optimistic] };
      });
    },

    /** Cancelamento otimista: remove minha reserva do cache do dia */
    applyCancelOptimistic: (userId: string) => {
      setByDay((prev) => ({
        ...prev,
        [selectedDate]: (prev[selectedDate] ?? []).filter(
          (r) => r.user_id !== userId
        ),
      }));
    },

    /** Reverte o dia pra um snapshot (usado quando a server action falha) */
    revertTo: (snapshot: ReservationWithProfile[]) => {
      setByDay((prev) => ({ ...prev, [selectedDate]: snapshot }));
    },
  };
}
