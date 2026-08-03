-- =====================================================================
-- Oncar Desk - Schema completo
-- =====================================================================
-- Rode este script inteiro no SQL Editor do Supabase (Database -> SQL Editor).
-- Ele cria as tabelas, seed dos 11 assentos, triggers, RLS e habilita realtime.
-- =====================================================================


-- ============================
-- 1. TABELAS
-- ============================

-- Profiles: espelha auth.users com dados públicos (nome, foto do Google).
-- Populado automaticamente via trigger no signup.
create table public.profiles (
  id         uuid        primary key references auth.users(id) on delete cascade,
  email      text        not null unique,
  full_name  text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seats: os 11 lugares físicos do escritório (dados fixos, não mudam).
create table public.seats (
  id                smallint primary key,
  label             text     not null,
  cluster           text     not null check (cluster in ('gustavo', 'a', 'b')),
  position          text     not null,           -- ex: 'solo', 'ponta', '2x2-top-left'
  is_fixed          boolean  not null default false,
  fixed_user_email  text                          -- se is_fixed=true, só esse email pode reservar
);

-- Reservations: uma linha por (user, data, cadeira).
-- Constraints garantem: 1 pessoa por dia, 1 pessoa por cadeira por dia.
create table public.reservations (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  seat_id    smallint    not null references public.seats(id),
  date       date        not null,
  created_at timestamptz not null default now(),

  unique(user_id, date),   -- 1 pessoa reserva no máximo 1 cadeira por dia
  unique(seat_id, date)    -- 1 cadeira é reservada no máximo 1 vez por dia
);

-- Daily notifications: pra idempotência do "escritório lotado" no Slack.
create table public.daily_notifications (
  date        date        primary key,
  notified_at timestamptz not null default now()
);


-- ============================
-- 2. ÍNDICES
-- ============================

create index reservations_date_idx    on public.reservations(date);
create index reservations_user_id_idx on public.reservations(user_id);


-- ============================
-- 3. SEED: OS 11 ASSENTOS
-- ============================
-- IMPORTANTE: troque o email do Gustavo pelo email real dele no Google Workspace
-- da Oncar antes de rodar. Se não souber ainda, deixe null e atualize depois:
--   update public.seats set fixed_user_email='gustavo@oncar.com.br' where id=1;

insert into public.seats (id, label, cluster, position, is_fixed, fixed_user_email) values
  ( 1, 'Gustavo',       'gustavo', 'solo',            true,  'gustavo@oncar.com.br'),
  ( 2, 'Cluster A - Ponta',  'a', 'ponta',            false, null),
  ( 3, 'Cluster A - Cima Esq', 'a', '2x2-top-left',   false, null),
  ( 4, 'Cluster A - Cima Dir', 'a', '2x2-top-right',  false, null),
  ( 5, 'Cluster A - Baixo Esq','a', '2x2-bot-left',   false, null),
  ( 6, 'Cluster A - Baixo Dir','a', '2x2-bot-right',  false, null),
  ( 7, 'Cluster B - Ponta',  'b', 'ponta',            false, null),
  ( 8, 'Cluster B - Cima Esq', 'b', '2x2-top-left',   false, null),
  ( 9, 'Cluster B - Cima Dir', 'b', '2x2-top-right',  false, null),
  (10, 'Cluster B - Baixo Esq','b', '2x2-bot-left',   false, null),
  (11, 'Cluster B - Baixo Dir','b', '2x2-bot-right',  false, null);


-- ============================
-- 4. FUNÇÕES E TRIGGERS
-- ============================

-- 4.1 Cria profile automaticamente quando usuário signa via OAuth Google.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  on conflict (id) do update set
    email      = excluded.email,
    full_name  = excluded.full_name,
    avatar_url = excluded.avatar_url,
    updated_at = now();
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- 4.2 Valida cada reserva: cadeira fixa só pro dono, sem data passada.
create or replace function public.validate_reservation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  seat_row   public.seats%rowtype;
  user_email text;
begin
  select * into seat_row from public.seats where id = new.seat_id;

  if seat_row.is_fixed then
    select email into user_email from public.profiles where id = new.user_id;
    if user_email is distinct from seat_row.fixed_user_email then
      raise exception 'Esta cadeira é dedicada e só pode ser reservada pelo dono.';
    end if;
  end if;

  if new.date < current_date then
    raise exception 'Não é possível reservar uma data no passado.';
  end if;

  return new;
end;
$$;

create trigger validate_reservation_trigger
  before insert or update on public.reservations
  for each row execute function public.validate_reservation();


-- 4.3 Trigger de notificação: quando escritório fica 11/11, marca pra notificar.
-- A chamada HTTP pro Slack vira responsabilidade de uma Edge Function (Fase 3).
-- Por enquanto, apenas grava em daily_notifications de forma idempotente.
create or replace function public.notify_office_full()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  reservation_count int;
begin
  select count(*) into reservation_count
  from public.reservations
  where date = new.date;

  if reservation_count = 11 then
    insert into public.daily_notifications (date)
    values (new.date)
    on conflict (date) do nothing;
    -- Fase 3: aqui a Edge Function faz POST no webhook do Slack via pg_net.
  end if;

  return new;
end;
$$;

create trigger notify_office_full_trigger
  after insert on public.reservations
  for each row execute function public.notify_office_full();


-- ============================
-- 5. RLS (Row Level Security)
-- ============================

alter table public.profiles             enable row level security;
alter table public.seats                enable row level security;
alter table public.reservations         enable row level security;
alter table public.daily_notifications  enable row level security;

-- Profiles: qualquer usuário autenticado lê todos os profiles.
-- Só o próprio usuário atualiza o próprio profile.
create policy "profiles são públicos entre autenticados"
  on public.profiles for select
  to authenticated
  using (true);

create policy "usuário atualiza próprio profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Seats: qualquer autenticado lê. Ninguém escreve (só admin via SQL Editor).
create policy "seats são públicas entre autenticados"
  on public.seats for select
  to authenticated
  using (true);

-- Reservations: qualquer autenticado lê. Só o próprio user cria/deleta a sua.
create policy "reservations são públicas entre autenticados"
  on public.reservations for select
  to authenticated
  using (true);

create policy "usuário cria própria reserva"
  on public.reservations for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "usuário deleta própria reserva (não retroativa)"
  on public.reservations for delete
  to authenticated
  using (auth.uid() = user_id and date >= current_date);

-- daily_notifications: nenhuma policy = ninguém acessa via cliente (só o trigger).


-- ============================
-- 6. REALTIME
-- ============================

-- Habilita realtime na tabela de reservations pra o frontend receber
-- INSERT/DELETE em tempo real (o "escritório vivo" que a gente combinou).
alter publication supabase_realtime add table public.reservations;
alter publication supabase_realtime add table public.profiles;
