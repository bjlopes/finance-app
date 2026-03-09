-- Tabela para armazenar dados financeiros por usuário
create table if not exists public.user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  transacoes jsonb default '[]'::jsonb,
  tags jsonb default '[]'::jsonb,
  contas jsonb default '[]'::jsonb,
  updated_at timestamptz default now()
);

-- Row Level Security: usuário só acessa seus próprios dados
alter table public.user_data enable row level security;

create policy "Users can read own data"
  on public.user_data for select
  using (auth.uid() = user_id);

create policy "Users can insert own data"
  on public.user_data for insert
  with check (auth.uid() = user_id);

create policy "Users can update own data"
  on public.user_data for update
  using (auth.uid() = user_id);

create policy "Users can delete own data"
  on public.user_data for delete
  using (auth.uid() = user_id);
