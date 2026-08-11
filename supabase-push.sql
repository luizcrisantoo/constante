-- ============================================================
-- CONSTANTE — Inscrições de push (lembretes)
-- Rode UMA VEZ no Supabase: SQL Editor -> cole -> Run.
-- Guarda a "inscrição" de push de cada aparelho, por usuário.
-- (A Etapa 2 — o envio agendado — vai ler daqui.)
-- ============================================================

create table if not exists public.push_subs (
  user_id    uuid not null references auth.users(id) on delete cascade,
  endpoint   text not null,
  inscricao  jsonb not null,
  criado_em  timestamptz not null default now(),
  primary key (user_id, endpoint)
);

alter table public.push_subs enable row level security;

drop policy if exists "push_subs ver"       on public.push_subs;
drop policy if exists "push_subs gravar"     on public.push_subs;
drop policy if exists "push_subs atualizar"  on public.push_subs;
drop policy if exists "push_subs apagar"     on public.push_subs;

create policy "push_subs ver" on public.push_subs for select to authenticated
  using (user_id = auth.uid());
create policy "push_subs gravar" on public.push_subs for insert to authenticated
  with check (user_id = auth.uid());
create policy "push_subs atualizar" on public.push_subs for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "push_subs apagar" on public.push_subs for delete to authenticated
  using (user_id = auth.uid());
