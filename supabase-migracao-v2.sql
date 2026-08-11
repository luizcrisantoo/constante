-- ============================================================
-- CONSTANTE v2 — MIGRAÇÃO MULTIUSUÁRIO (rodar no SQL Editor)
-- Contas com login: cada usuário só enxerga a própria linha,
-- garantido pelo BANCO (RLS com auth.uid()), não pelo app.
-- A tabela antiga constante_state (sync por código) pode ficar
-- por enquanto; quando o Luiz migrar os 2 aparelhos, é só dropar.
-- ============================================================

-- 1) Tabela de contas: uma linha por usuário
create table if not exists public.constante_accounts (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  payload    jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.constante_accounts enable row level security;

-- 2) RLS de verdade: só o dono lê/escreve a própria linha
create policy "conta: dono le" on public.constante_accounts
  for select to authenticated using (auth.uid() = user_id);
create policy "conta: dono insere" on public.constante_accounts
  for insert to authenticated with check (auth.uid() = user_id);
create policy "conta: dono atualiza" on public.constante_accounts
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3) LGPD: botão "apagar minha conta" — remove o usuário do auth;
--    o ON DELETE CASCADE acima apaga os dados junto.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'não autenticado';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- ============================================================
-- DEPOIS DE RODAR ESTE SQL, no painel do Supabase:
-- 1. Authentication → URL Configuration:
--      Site URL = https://luizcrisantoo.github.io/constante/
--      (é pra onde apontam os links de confirmação/recuperação)
-- 2. Authentication → Sign In / Providers → Email:
--      "Confirm email" LIGADO (decisão do Luiz).
--      Obs.: o e-mail embutido do Supabase é MUITO limitado (poucos
--      envios/hora) — serve pra você e os primeiros testers. Antes de
--      abrir pro público: Authentication → SMTP → configurar um Resend
--      (grátis até 3 mil e-mails/mês) com um domínio seu.
-- 3. Preencher js/config.js do app com a Project URL e a anon key.
-- ============================================================
