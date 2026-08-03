"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Reservation, Profile } from "@/lib/types";

export type ReservationWithProfile = Reservation & {
  profiles: Pick<Profile, "id" | "full_name" | "avatar_url" | "email"> | null;
};

/**
 * Mantém a lista de reservas atualizada via Supabase Realtime.
 *
 * - Recebe `initialData` do server component (SSR)
 * - Escuta INSERT/DELETE na tabela `reservations`
 * - Quando muda, refaz a query pra pegar o profile junto (evita manter cache complexo)
 */
export function useReservations(
  initialData: ReservationWithProfile[],
  date: string
) {
  const [reservations, setReservations] =
    useState<ReservationWithProfile[]>(initialData);
  const [loading, setLoading] = useState(false);

  const fetchReservations = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("reservations")
      .select("*, profiles(id, full_name, avatar_url, email)")
      .eq("date", date);

    if (data) {
      setReservations(data as ReservationWithProfile[]);
    }
  }, [date]);

  // Quando a data muda, atualiza
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
          // Refetch completo pra pegar o profile junto.
          // Mais simples que montar o join localmente.
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
    loading,
    /** Atualiza otimisticamente enquanto a server action resolve */
    addOptimistic: (reservation: ReservationWithProfile) => {
      setReservations((prev) => [...prev, reservation]);
    },
    removeOptimistic: (userId: string) => {
      setReservations((prev) => prev.filter((r) => r.user_id !== userId));
    },
  };
}
