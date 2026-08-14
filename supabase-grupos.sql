-- ============================================================
-- CONSTANTE — Fase 4c: GRUPOS (de 2 a 8 pessoas)
-- Rode isto no SQL Editor do Supabase, DEPOIS do supabase-amigos.sql.
--
-- Isto SUBSTITUI o supabase-duplas.sql: a dupla virou um grupo de 2 pessoas.
-- Como ninguém chegou a usar as tabelas de dupla, elas são removidas aqui.
--
-- Como funciona: alguém cria o grupo com um nome e um código. Quem recebe o
-- código entra escolhendo qual hábito SEU conta ali. O contador do grupo só
-- anda no dia em que a meta for batida (por padrão: todo mundo). A constância
-- individual de cada um não é afetada por nada disso.
-- ============================================================

drop table if exists public.constante_dupla_dias;
drop table if exists public.constante_duplas;

create table if not exists public.constante_grupos (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null default 'Grupo',
  codigo     text unique not null,
  meta       int,                       -- null = todo mundo precisa bater
  criado_por uuid references auth.users(id) on delete set null,
  criado_em  timestamptz default now()
);

create table if not exists public.constante_grupo_membros (
  grupo_id  uuid not null references public.constante_grupos(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  habito    text not null default '',   -- id do hábito local dessa pessoa
  nome      text default '',            -- primeiro nome, pros outros verem quem é
  entrou_em timestamptz default now(),
  primary key (grupo_id, user_id)
);
create index if not exists idx_gm_user on public.constante_grupo_membros(user_id);

create table if not exists public.constante_grupo_dias (
  grupo_id uuid not null references public.constante_grupos(id) on delete cascade,
  user_id  uuid not null references auth.users(id) on delete cascade,
  data     date not null,
  primary key (grupo_id, user_id, data)
);
create index if not exists idx_gd_grupo on public.constante_grupo_dias(grupo_id, data);

-- ---------- Ajudante: "eu sou membro desse grupo?" ----------
-- Precisa ser security definer, senão a policy da tabela de membros consulta
-- a si mesma e o Postgres entra em recursão infinita.
create or replace function public.sou_membro(g uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.constante_grupo_membros m
    where m.grupo_id = g and m.user_id = auth.uid()
  );
$$;
revoke all on function public.sou_membro(uuid) from public;
grant execute on function public.sou_membro(uuid) to authenticated;

alter table public.constante_grupos        enable row level security;
alter table public.constante_grupo_membros enable row level security;
alter table public.constante_grupo_dias    enable row level security;

-- ---------- Grupos ----------
drop policy if exists "grupo ler" on public.constante_grupos;
create policy "grupo ler" on public.constante_grupos
  for select using (public.sou_membro(id));

drop policy if exists "grupo criar" on public.constante_grupos;
create policy "grupo criar" on public.constante_grupos
  for insert with check (auth.uid() = criado_por);

-- qualquer membro pode ajustar nome e meta (é um trato entre eles)
drop policy if exists "grupo ajustar" on public.constante_grupos;
create policy "grupo ajustar" on public.constante_grupos
  for update using (public.sou_membro(id)) with check (public.sou_membro(id));

drop policy if exists "grupo apagar" on public.constante_grupos;
create policy "grupo apagar" on public.constante_grupos
  for delete using (auth.uid() = criado_por);

-- ---------- Membros ----------
drop policy if exists "membros ler" on public.constante_grupo_membros;
create policy "membros ler" on public.constante_grupo_membros
  for select using (public.sou_membro(grupo_id));

-- entrar é só pela função entrar_no_grupo; mas o criador insere a si mesmo
drop policy if exists "membro entrar proprio" on public.constante_grupo_membros;
create policy "membro entrar proprio" on public.constante_grupo_membros
  for insert with check (user_id = auth.uid());

drop policy if exists "membro editar proprio" on public.constante_grupo_membros;
create policy "membro editar proprio" on public.constante_grupo_membros
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- cada um sai sozinho (e ninguém tira ninguém)
drop policy if exists "membro sair" on public.constante_grupo_membros;
create policy "membro sair" on public.constante_grupo_membros
  for delete using (user_id = auth.uid());

-- ---------- Dias ----------
drop policy if exists "gdias ler" on public.constante_grupo_dias;
create policy "gdias ler" on public.constante_grupo_dias
  for select using (public.sou_membro(grupo_id));

drop policy if exists "gdias marcar" on public.constante_grupo_dias;
create policy "gdias marcar" on public.constante_grupo_dias
  for insert with check (user_id = auth.uid() and public.sou_membro(grupo_id));

drop policy if exists "gdias desmarcar" on public.constante_grupo_dias;
create policy "gdias desmarcar" on public.constante_grupo_dias
  for delete using (user_id = auth.uid());

-- ---------- Entrar por código ----------
create or replace function public.entrar_no_grupo(p_codigo text, p_habito text, p_nome text)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_id    uuid;
  v_nome  text;
  v_qtd   int;
  v_eu    uuid := auth.uid();
begin
  if v_eu is null then
    return json_build_object('ok', false, 'erro', 'precisa estar logado');
  end if;

  select id, nome into v_id, v_nome
  from public.constante_grupos
  where codigo = upper(trim(p_codigo));

  if v_id is null then
    return json_build_object('ok', false, 'erro', 'código de grupo não encontrado');
  end if;

  select count(*) into v_qtd from public.constante_grupo_membros where grupo_id = v_id;
  if v_qtd >= 8 then
    return json_build_object('ok', false, 'erro', 'esse grupo já está cheio (8 pessoas)');
  end if;

  insert into public.constante_grupo_membros (grupo_id, user_id, habito, nome)
  values (v_id, v_eu, coalesce(p_habito, ''), coalesce(p_nome, ''))
  on conflict (grupo_id, user_id) do update set habito = excluded.habito, nome = excluded.nome;

  return json_build_object('ok', true, 'id', v_id, 'nome', v_nome);
end;
$$;
revoke all on function public.entrar_no_grupo(text, text, text) from public;
grant execute on function public.entrar_no_grupo(text, text, text) to authenticated;

-- ---------- Grupo sem ninguém se apaga sozinho ----------
create or replace function public.limpar_grupo_vazio()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.constante_grupo_membros where grupo_id = old.grupo_id) then
    delete from public.constante_grupos where id = old.grupo_id;
  end if;
  return old;
end;
$$;
drop trigger if exists trg_limpar_grupo on public.constante_grupo_membros;
create trigger trg_limpar_grupo after delete on public.constante_grupo_membros
  for each row execute function public.limpar_grupo_vazio();
