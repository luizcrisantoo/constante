-- ============================================================
-- CONSTANTE — setup do Supabase (rodar no SQL Editor)
-- Cria a tabela de sincronização entre celular e notebook.
-- ============================================================

create table if not exists public.constante_state (
  sync_code  text primary key,
  payload    jsonb not null,
  updated_at timestamptz not null default now()
);

-- Segurança em nível de linha (RLS)
alter table public.constante_state enable row level security;

-- ⚠️ HONESTIDADE SOBRE O MODELO DE SEGURANÇA (uso pessoal):
-- Estas policies liberam leitura/escrita para quem tiver a URL + anon key do
-- SEU projeto. O filtro por sync_code é feito pelo app, não pelo banco.
-- Na prática: mantenha URL e anon key só nos seus aparelhos, use um código
-- longo e único (ex.: luiz-2026-x7k9-quadril) e não compartilhe seu projeto.
-- O app NÃO envia suas chaves/código dentro do payload.
-- Para uso multiusuário/produto: use a versão com Auth comentada no fim.
create policy "constante leitura"  on public.constante_state
  for select using (true);
create policy "constante escrita"  on public.constante_state
  for insert with check (true);
create policy "constante update"   on public.constante_state
  for update using (true);

-- OBS (versão produto/multiusuário): trocar as policies acima por
-- autenticação (Supabase Auth) com user_id = auth.uid(). Está comentado
-- aqui como ponto de extensão:
-- alter table public.constante_state add column user_id uuid references auth.users(id);
-- create policy "dono lê"    on public.constante_state for select using (auth.uid() = user_id);
-- create policy "dono grava" on public.constante_state for all   using (auth.uid() = user_id);
