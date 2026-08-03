import { createClient } from "@/lib/supabase/server";
import { getWeekdaysAhead } from "@/lib/utils";
import { DeskClient } from "./desk-client";
import type { Profile, Seat } from "@/lib/types";
import type { ReservationWithProfile } from "@/lib/hooks/use-reservations";

export const dynamic = "force-dynamic";

export default async function DeskPage() {
  const supabase = await createClient();

  // Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();
  if (!profile) return null;

  // Seats (fixos, 11 linhas)
  const { data: seats } = await supabase
    .from("seats")
    .select("*")
    .order("id");

  // Reservas dos próximos 5 dias úteis
  const days = getWeekdaysAhead(5);
  const { data: allReservations } = await supabase
    .from("reservations")
    .select("*, profiles(id, full_name, avatar_url, email)")
    .in("date", days);

  // Agrupa por data
  const grouped: Record<string, ReservationWithProfile[]> = {};
  const counts: Record<string, number> = {};
  for (const day of days) {
    grouped[day] = [];
    counts[day] = 0;
  }
  for (const r of (allReservations ?? []) as ReservationWithProfile[]) {
    if (grouped[r.date]) {
      grouped[r.date].push(r);
      counts[r.date] = (counts[r.date] ?? 0) + 1;
    }
  }

  return (
    <DeskClient
      profile={profile}
      seats={(seats ?? []) as Seat[]}
      initialReservations={grouped}
      counts={counts}
    />
  );
}
