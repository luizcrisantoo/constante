-- ============================================================
-- CONSTANTE — SETUP COMPLETO DO SUPABASE (tudo em um)
-- Rode UMA VEZ no SQL Editor: New query -> cole tudo -> Run.
-- É seguro rodar mesmo se você já tiver rodado alguma parte
-- (usa "if not exists" / "on conflict" / "drop policy if exists").
-- Junta: (1) limite da IA  (2) cofre de fotos  (3) inscrições de push.
-- ============================================================


-- ------------------------------------------------------------
-- (1) LIMITE DIÁRIO DE MENSAGENS DO ASSISTENTE
-- ------------------------------------------------------------
create table if not exists public.assistente_uso (
  user_id   uuid not null references auth.users(id) on delete cascade,
  dia       date not null,
  contagem  int  not null default 0,
  primary key (user_id, dia)
);

alter table public.assistente_uso enable row level security;

create or replace function public.assistente_inc(p_user uuid, p_dia date)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare v int;
begin
  insert into public.assistente_uso (user_id, dia, contagem)
  values (p_user, p_dia, 1)
  on conflict (user_id, dia)
  do update set contagem = public.assistente_uso.contagem + 1
  returning contagem into v;
  return v;
end;
$$;


-- ------------------------------------------------------------
-- (2) COFRE PRIVADO DE FOTOS DE PROGRESSO (Storage)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('progresso', 'progresso', false)
on conflict (id) do nothing;

drop policy if exists "progresso ver"    on storage.objects;
drop policy if exists "progresso enviar" on storage.objects;
drop policy if exists "progresso apagar" on storage.objects;

create policy "progresso ver" on storage.objects for select to authenticated
  using (bucket_id = 'progresso' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "progresso enviar" on storage.objects for insert to authenticated
  with check (bucket_id = 'progresso' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "progresso apagar" on storage.objects for delete to authenticated
  using (bucket_id = 'progresso' and (storage.foldername(name))[1] = auth.uid()::text);


-- ------------------------------------------------------------
-- (3) INSCRIÇÕES DE PUSH (lembretes / notificações)
-- ------------------------------------------------------------
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

-- Fim. Deve aparecer "Success. No rows returned".
