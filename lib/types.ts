/**
 * Tipos TypeScript espelhando o schema do Postgres.
 * Se um dia quiser gerar automaticamente, use `supabase gen types typescript`.
 */

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type SeatCluster = "gustavo" | "a" | "b";
export type SeatPosition =
  | "solo"
  | "ponta"
  | "2x2-top-left"
  | "2x2-top-right"
  | "2x2-bot-left"
  | "2x2-bot-right";

export type Seat = {
  id: number;
  label: string;
  cluster: SeatCluster;
  position: SeatPosition;
  is_fixed: boolean;
  fixed_user_email: string | null;
};

export type Reservation = {
  id: string;
  user_id: string;
  seat_id: number;
  date: string;         // 'YYYY-MM-DD'
  created_at: string;
};

/** Reserva com dados do usuário (útil pra renderizar o mapa) */
export type ReservationWithProfile = Reservation & {
  profile: Pick<Profile, "id" | "full_name" | "avatar_url" | "email">;
};
