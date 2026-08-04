"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Reservation, Profile } from "@/lib/types";

export type ReservationWithProfile = Reservation & {
  profiles: Pick<Profile, "id" | "full_name" | "avatar_url" | "email"> | null;
};

/**
 * Mantém a lista de reservas atualizada via Supabase Realtime + mutações otimistas.
 *
 * - Recebe `initialData` do server component (SSR)
 * - Escuta INSERT/DELETE na tabela `reservations` (só do dia selecionado)
 * - Expõe `applyOptimistic` pra o clique atualizar a UI IMEDIATAMENTE
 * - O realtime reconcilia o estado real quando o servidor confirma
 */
export function useReservations(
  initialData: ReservationWithProfile[],
  date: string
) {
  const [reservations, setReservations] =
    useState<ReservationWithProfile[]>(initialData);

  // Guarda a data atual pra ignorar refetch de datas antigas (race condition)
  const dateRef = useRef(date);
  dateRef.current = date;

  const fetchReservations = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("reservations")
      .select("*, profiles(id, full_name, avatar_url, email)")
      .eq("date", date);

    // Só aplica se ainda estamos no mesmo dia (evita sobrescrever com dado velho)
    if (data && dateRef.current === date) {
      setReservations(data as ReservationWithProfile[]);
    }
  }, [date]);

  // Quando a data muda, reseta pro SSR daquele dia
  useEffect(() => {
    setReservations(initialData);
  }, [initialData]);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`reservations:${date}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reservations",
          filter: `date=eq.${date}`,
        },
        () => {
          fetchReservations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [date, fetchReservations]);

  return {
    reservations,

    /**
     * Reserva otimista: insere localmente na hora, sem esperar servidor.
     * Se a pessoa já tinha uma reserva no dia, troca de cadeira.
     */
    applyReserveOptimistic: (
      seatId: number,
      me: Pick<Profile, "id" | "full_name" | "avatar_url" | "email">
    ) => {
      setReservations((prev) => {
        // Remove qualquer reserva minha anterior nesse dia
        const withoutMine = prev.filter((r) => r.user_id !== me.id);
        const optimistic: ReservationWithProfile = {
          id: `optimistic-${seatId}-${date}`,
          user_id: me.id,
          seat_id: seatId,
          date,
          created_at: new Date().toISOString(),
          profiles: me,
        };
        return [...withoutMine, optimistic];
      });
    },

    /** Cancelamento otimista: remove minha reserva do dia na hora */
    applyCancelOptimistic: (userId: string) => {
      setReservations((prev) => prev.filter((r) => r.user_id !== userId));
    },

    /** Reverte pra um snapshot (usado quando a server action falha) */
    revertTo: (snapshot: ReservationWithProfile[]) => {
      setReservations(snapshot);
    },

    /** Força refetch (fallback) */
    refetch: fetchReservations,
  };
}
