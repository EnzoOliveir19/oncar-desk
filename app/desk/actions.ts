"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
      // unique constraint violated
      if (error.message.includes("user_id")) {
        return { error: "Você já reservou uma cadeira nesse dia." };
      }
      return { error: "Essa cadeira já foi reservada." };
    }
    return { error: error.message };
  }

  revalidatePath("/desk");
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

  revalidatePath("/desk");
  return { error: null };
}
