-- Salas (palavra secreta fica aqui; clientes usam a view rooms_public)
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  host_id uuid,
  status text not null default 'waiting' check (status in ('waiting', 'playing', 'finished')),
  current_round int not null default 0,
  total_rounds int not null default 0,
  drawer_id uuid,
  round_started_at timestamptz,
  round_duration int not null default 80,
  created_at timestamptz not null default now()
);

create or replace view public.rooms_public as
select
  id,
  code,
  host_id,
  status,
  current_round,
  total_rounds,
  drawer_id,
  round_started_at,
  round_duration,
  created_at
from public.rooms;

-- Palavra secreta (somente leitura via service role nas API routes)
create table if not exists public.room_secrets (
  room_id uuid primary key references public.rooms (id) on delete cascade,
  word text
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  name text not null,
  score int not null default 0,
  is_host boolean not null default false,
  connected boolean not null default true,
  guessed_this_round boolean not null default false,
  joined_at timestamptz not null default now()
);

create index if not exists players_room_id_idx on public.players (room_id);

-- Traços de desenho (validados no servidor; sync via Realtime INSERT)
create table if not exists public.drawing_strokes (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  round_number int not null,
  stroke jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists drawing_strokes_room_round_idx
  on public.drawing_strokes (room_id, round_number);

-- Chat e palpites
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  player_name text not null,
  message text not null,
  is_correct boolean not null default false,
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_room_id_idx on public.chat_messages (room_id);

alter table public.rooms enable row level security;
alter table public.players enable row level security;
alter table public.drawing_strokes enable row level security;
alter table public.chat_messages enable row level security;
alter table public.room_secrets enable row level security;

-- Leitura pública para Realtime (escritas apenas via service role nas API routes)
-- room_secrets: sem política de SELECT (apenas service role)
create policy "rooms_public_select" on public.rooms for select using (true);
create policy "players_select" on public.players for select using (true);
create policy "drawing_strokes_select" on public.drawing_strokes for select using (true);
create policy "chat_messages_select" on public.chat_messages for select using (true);

-- Realtime
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.players;
alter publication supabase_realtime add table public.drawing_strokes;
alter publication supabase_realtime add table public.chat_messages;
