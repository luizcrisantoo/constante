-- ============================================================
-- CONSTANTE — Fase 4d: convidar pessoas pro grupo (estilo WhatsApp)
-- Rode isto DEPOIS do supabase-amigos.sql e do supabase-grupos.sql.
--
-- O que muda: além de entrar por código, agora dá pra CHAMAR quem já é teu amigo.
-- A pessoa chamada não entra na marra: ela recebe um convite e, ao aceitar,
-- escolhe qual hábito dela conta ali.
-- ============================================================

-- ---------- 1. Estado do membro ----------
alter table public.constante_grupo_membros
  add column if not exists status text not null default 'ativo';   -- 'convidado' | 'ativo'

alter table public.constante_grupo_membros
  add column if not exists convidou uuid references auth.users(id) on delete set null;

-- quem já estava dentro segue ativo
update public.constante_grupo_membros set status = 'ativo' where status is null;

-- ---------- 2. Ajudantes ----------
-- membro de verdade (conta pra meta e pode ver os dias)
create or replace function public.sou_membro(g uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.constante_grupo_membros m
    where m.grupo_id = g and m.user_id = auth.uid() and m.status = 'ativo'
  );
$$;

-- convidado: enxerga o grupo pra poder decidir, mas não vê os dias nem conta na meta
create or replace function public.sou_convidado(g uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.constante_grupo_membros m
    where m.grupo_id = g and m.user_id = auth.uid() and m.status = 'convidado'
  );
$$;

-- somos amigos? (usado pra permitir o convite)
create or replace function public.somos_amigos(outro uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.constante_amizades f
    where (f.a = least(auth.uid(), outro) and f.b = greatest(auth.uid(), outro))
  );
$$;

revoke all on function public.sou_convidado(uuid) from public;
revoke all on function public.somos_amigos(uuid) from public;
grant execute on function public.sou_convidado(uuid) to authenticated;
grant execute on function public.somos_amigos(uuid) to authenticated;

-- ---------- 3. Políticas ----------
-- o convidado precisa enxergar o grupo (nome) pra decidir se aceita
drop policy if exists "grupo ler" on public.constante_grupos;
create policy "grupo ler" on public.constante_grupos
  for select using (public.sou_membro(id) or public.sou_convidado(id));

drop policy if exists "membros ler" on public.constante_grupo_membros;
create policy "membros ler" on public.constante_grupo_membros
  for select using (public.sou_membro(grupo_id) or public.sou_convidado(grupo_id));

-- inserir: eu mesmo (criar/entrar por código) OU convidar um amigo pra um grupo meu
drop policy if exists "membro entrar proprio" on public.constante_grupo_membros;
drop policy if exists "membro entrar ou convidar" on public.constante_grupo_membros;
create policy "membro entrar ou convidar" on public.constante_grupo_membros
  for insert with check (
    user_id = auth.uid()
    or (
      status = 'convidado'
      and public.sou_membro(grupo_id)
      and public.somos_amigos(user_id)
    )
  );

-- atualizar só a própria linha (é assim que se aceita o convite)
drop policy if exists "membro editar proprio" on public.constante_grupo_membros;
create policy "membro editar proprio" on public.constante_grupo_membros
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- sair/recusar: só a própria linha (ninguém tira ninguém)
drop policy if exists "membro sair" on public.constante_grupo_membros;
create policy "membro sair" on public.constante_grupo_membros
  for delete using (user_id = auth.uid());

-- ---------- 4. Entrar por código continua funcionando ----------
create or replace function public.entrar_no_grupo(p_codigo text, p_habito text, p_nome text)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_id uuid; v_nome text; v_qtd int; v_eu uuid := auth.uid();
begin
  if v_eu is null then
    return json_build_object('ok', false, 'erro', 'precisa estar logado');
  end if;

  select id, nome into v_id, v_nome from public.constante_grupos
  where codigo = upper(trim(p_codigo));

  if v_id is null then
    return json_build_object('ok', false, 'erro', 'código de grupo não encontrado');
  end if;

  select count(*) into v_qtd from public.constante_grupo_membros
  where grupo_id = v_id and status = 'ativo';
  if v_qtd >= 8 then
    return json_build_object('ok', false, 'erro', 'esse grupo já está cheio (8 pessoas)');
  end if;

  insert into public.constante_grupo_membros (grupo_id, user_id, habito, nome, status)
  values (v_id, v_eu, coalesce(p_habito, ''), coalesce(p_nome, ''), 'ativo')
  on conflict (grupo_id, user_id)
    do update set habito = excluded.habito, nome = excluded.nome, status = 'ativo';

  return json_build_object('ok', true, 'id', v_id, 'nome', v_nome);
end;
$$;
revoke all on function public.entrar_no_grupo(text, text, text) from public;
grant execute on function public.entrar_no_grupo(text, text, text) to authenticated;

-- ---------- 5. Grupo sem NINGUÉM ativo se apaga ----------
create or replace function public.limpar_grupo_vazio()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.constante_grupo_membros
    where grupo_id = old.grupo_id and status = 'ativo'
  ) then
    delete from public.constante_grupos where id = old.grupo_id;
  end if;
  return old;
end;
$$;
