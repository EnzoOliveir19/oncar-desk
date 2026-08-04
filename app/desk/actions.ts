"use server";

import { createClient } from "@/lib/supabase/server";

// NOTA: nada de `revalidatePath` aqui. A propagação da mudança pra outros
// clientes acontece via Supabase Realtime (canal `reservations:${date}`).
// O cliente que iniciou a ação faz UI otimista imediata (desk-client.tsx).
// Chamar revalidatePath forçava re-fetch completo do server component em
// cada clique — refetch de profile + seats + 5 dias de reservas com join.
// Era o principal motivo dos 10s de espera.

export async function reserveSeat(seatId: number, date: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Não autenticado." };

  const { error } = await supabase.from("reservations").insert({
    user_id: user.id,
    seat_id: seatId,
    date,
  });

  if (error) {
    if (error.code === "23505") {
      if (error.message.includes("user_id")) {
        return { error: "Você já reservou uma cadeira nesse dia." };
      }
      return { error: "Essa cadeira já foi reservada." };
    }
    return { error: error.message };
  }

  return { error: null };
}

export async function cancelReservation(date: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Não autenticado." };

  const { error } = await supabase
    .from("reservations")
    .delete()
    .eq("user_id", user.id)
    .eq("date", date);

  if (error) return { error: error.message };

  return { error: null };
}
