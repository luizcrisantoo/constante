-- ============================================================
-- CONSTANTE — Fase 4: adicionar alguém e compartilhar hábitos
-- Rode isto UMA VEZ no SQL Editor do Supabase.
--
-- Princípios que o desenho garante:
-- • ninguém te encontra por busca: só entra quem recebeu o teu código
-- • o código não pode ser usado pra ESPIAR — ele só serve pra criar a amizade,
--   através de uma função controlada (aceitar_convite)
-- • o amigo lê só o teu cartão público (nome, constância, moldura e os hábitos
--   que VOCÊ marcou). Teu estado completo continua trancado na outra tabela.
-- • qualquer um dos dois desfaz a amizade sozinho
-- ============================================================

-- ---------- 1. Cartão público (o que o amigo pode ver) ----------
create table if not exists public.constante_perfil_publico (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  codigo      text unique not null,
  nome        text default '',
  streak      int  default 0,
  melhor      int  default 0,
  moldura     text default 'semente',
  habitos     jsonb default '[]'::jsonb,   -- só os que a pessoa marcou pra compartilhar
  atualizado  timestamptz default now()
);

-- ---------- 2. Amizades ----------
-- uma linha por par, sempre com o menor uuid em "a" (evita duplicata invertida)
create table if not exists public.constante_amizades (
  a         uuid not null references auth.users(id) on delete cascade,
  b         uuid not null references auth.users(id) on delete cascade,
  criado_em timestamptz default now(),
  primary key (a, b),
  check (a < b)
);
create index if not exists idx_amizades_a on public.constante_amizades(a);
create index if not exists idx_amizades_b on public.constante_amizades(b);

alter table public.constante_perfil_publico enable row level security;
alter table public.constante_amizades       enable row level security;

-- ---------- 3. Quem pode ler o quê ----------
-- o dono sempre vê e escreve o próprio cartão
drop policy if exists "cartao proprio" on public.constante_perfil_publico;
create policy "cartao proprio" on public.constante_perfil_publico
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- amigos podem LER o cartão um do outro (e só ler)
drop policy if exists "cartao de amigo" on public.constante_perfil_publico;
create policy "cartao de amigo" on public.constante_perfil_publico
  for select using (
    exists (
      select 1 from public.constante_amizades f
      where (f.a = auth.uid() and f.b = constante_perfil_publico.user_id)
         or (f.b = auth.uid() and f.a = constante_perfil_publico.user_id)
    )
  );

-- cada um enxerga só as amizades das quais participa
drop policy if exists "minhas amizades" on public.constante_amizades;
create policy "minhas amizades" on public.constante_amizades
  for select using (auth.uid() = a or auth.uid() = b);

-- qualquer um dos dois pode desfazer
drop policy if exists "desfazer amizade" on public.constante_amizades;
create policy "desfazer amizade" on public.constante_amizades
  for delete using (auth.uid() = a or auth.uid() = b);

-- Repare que NÃO existe policy de INSERT em amizades: criar amizade só pela função abaixo.

-- ---------- 4. Aceitar um convite ----------
-- security definer: roda com permissão elevada, mas só faz uma coisa e valida tudo.
create or replace function public.aceitar_convite(p_codigo text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dono uuid;
  v_nome text;
  v_eu   uuid := auth.uid();
  v_a    uuid;
  v_b    uuid;
begin
  if v_eu is null then
    return json_build_object('ok', false, 'erro', 'precisa estar logado');
  end if;

  select user_id, nome into v_dono, v_nome
  from public.constante_perfil_publico
  where codigo = upper(trim(p_codigo));

  if v_dono is null then
    return json_build_object('ok', false, 'erro', 'código não encontrado');
  end if;

  if v_dono = v_eu then
    return json_build_object('ok', false, 'erro', 'esse código é o seu');
  end if;

  v_a := least(v_eu, v_dono);
  v_b := greatest(v_eu, v_dono);

  insert into public.constante_amizades (a, b)
  values (v_a, v_b)
  on conflict do nothing;

  return json_build_object('ok', true, 'nome', coalesce(nullif(v_nome, ''), 'teu amigo'));
end;
$$;

revoke all on function public.aceitar_convite(text) from public;
grant execute on function public.aceitar_convite(text) to authenticated;

-- ---------- 5. Apagar a conta leva o cartão junto ----------
-- (o "on delete cascade" das duas tabelas já cuida disso)
