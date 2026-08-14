-- ============================================================
-- CONSTANTE — Fase 4b: dupla (o "foguinho" de dois)
-- Rode isto UMA VEZ no SQL Editor do Supabase, DEPOIS do supabase-amigos.sql.
--
-- Ideia: dois amigos escolhem um hábito cada um pra fazer junto. O contador só
-- anda no dia em que os DOIS baterem. Se só um bater, no dia seguinte a conta
-- recomeça. É um contador do par — o individual de cada um não é afetado.
-- ============================================================

-- ---------- 1. O par ----------
create table if not exists public.constante_duplas (
  id          uuid primary key default gen_random_uuid(),
  a           uuid not null references auth.users(id) on delete cascade,
  b           uuid not null references auth.users(id) on delete cascade,
  habito_a    text not null,      -- id do hábito de "a" (id local, não é dado sensível)
  habito_b    text not null,
  nome        text default '',    -- como o par aparece pros dois (ex.: "Academia")
  criado_em   timestamptz default now(),
  check (a <> b)
);
create index if not exists idx_duplas_a on public.constante_duplas(a);
create index if not exists idx_duplas_b on public.constante_duplas(b);

-- ---------- 2. Os dias em que cada um bateu ----------
create table if not exists public.constante_dupla_dias (
  dupla_id  uuid not null references public.constante_duplas(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  data      date not null,
  primary key (dupla_id, user_id, data)
);
create index if not exists idx_dupla_dias on public.constante_dupla_dias(dupla_id, data);

alter table public.constante_duplas     enable row level security;
alter table public.constante_dupla_dias enable row level security;

-- ---------- 3. Quem pode o quê ----------
-- os dois participantes leem e podem desfazer o par
drop policy if exists "dupla ler" on public.constante_duplas;
create policy "dupla ler" on public.constante_duplas
  for select using (auth.uid() = a or auth.uid() = b);

drop policy if exists "dupla apagar" on public.constante_duplas;
create policy "dupla apagar" on public.constante_duplas
  for delete using (auth.uid() = a or auth.uid() = b);

-- só dá pra criar par com quem já é amigo, e só incluindo você mesmo
drop policy if exists "dupla criar" on public.constante_duplas;
create policy "dupla criar" on public.constante_duplas
  for insert with check (
    (auth.uid() = a or auth.uid() = b)
    and exists (
      select 1 from public.constante_amizades f
      where (f.a = least(constante_duplas.a, constante_duplas.b)
         and f.b = greatest(constante_duplas.a, constante_duplas.b))
    )
  );

-- os dias: cada um só escreve os PRÓPRIOS, e só de um par do qual participa
drop policy if exists "dias ler" on public.constante_dupla_dias;
create policy "dias ler" on public.constante_dupla_dias
  for select using (
    exists (select 1 from public.constante_duplas d
            where d.id = constante_dupla_dias.dupla_id
              and (d.a = auth.uid() or d.b = auth.uid()))
  );

drop policy if exists "dias marcar" on public.constante_dupla_dias;
create policy "dias marcar" on public.constante_dupla_dias
  for insert with check (
    user_id = auth.uid()
    and exists (select 1 from public.constante_duplas d
                where d.id = constante_dupla_dias.dupla_id
                  and (d.a = auth.uid() or d.b = auth.uid()))
  );

drop policy if exists "dias desmarcar" on public.constante_dupla_dias;
create policy "dias desmarcar" on public.constante_dupla_dias
  for delete using (user_id = auth.uid());
