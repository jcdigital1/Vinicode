-- ====================================================================
-- VINI CODE — ESQUEMA DO BANCO DE DADOS SUPABASE (PostgreSQL + RLS)
-- Cole e execute este script no "SQL Editor" do seu painel Supabase
-- ====================================================================

-- 1. TABELA DE QR CODES DINÂMICOS
create table if not exists public.qr_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code varchar(20) not null unique,
  name varchar(255) not null,
  destination_url text not null,
  active boolean not null default true,
  type varchar(50) not null default 'custom',
  scan_count integer not null default 0,
  last_scanned_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Index para busca ultra-rápida no redirecionamento público
create index if not exists idx_qr_codes_code on public.qr_codes (code);
create index if not exists idx_qr_codes_user_id on public.qr_codes (user_id);

-- 2. TABELA DE EMPRESAS / AVALIAÇÕES GOOGLE
create table if not exists public.google_businesses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_name varchar(255) not null,
  address text,
  city varchar(100),
  place_id varchar(255) not null,
  review_url text not null,
  qr_code_id uuid references public.qr_codes(id) on delete set null,
  created_at timestamp with time zone default now()
);

create index if not exists idx_google_businesses_user_id on public.google_businesses (user_id);

-- 3. HABILITAR ROW LEVEL SECURITY (RLS)
alter table public.qr_codes enable row level security;
alter table public.google_businesses enable row level security;

-- 4. POLÍTICAS DE SEGURANÇA (RLS) PARA QR CODES:
-- Permissão pública para consulta de redirecionamento (essencial para quem escaneia a placa)
create policy "Leitura pública de destino de QR Code ativo"
  on public.qr_codes
  for select
  using (true);

-- Permissão pública para incrementar contagem de escaneamento
create policy "Atualização de contagem de escaneamento pública"
  on public.qr_codes
  for update
  using (true)
  with check (true);

-- O usuário autenticado gerencia apenas seus próprios QR Codes
create policy "Usuários gerenciam seus próprios QR Codes"
  on public.qr_codes
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 5. POLÍTICAS DE SEGURANÇA (RLS) PARA EMPRESAS GOOGLE:
create policy "Usuários gerenciam suas próprias empresas Google"
  on public.google_businesses
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
