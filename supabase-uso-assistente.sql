-- ============================================================
-- CONSTANTE — Limite diário de mensagens do assistente (por usuário)
-- Rode isto UMA VEZ no Supabase: SQL Editor -> cole -> Run.
-- A Edge Function "assistente" conta e verifica o uso por aqui.
-- ============================================================

create table if not exists public.assistente_uso (
  user_id   uuid not null references auth.users(id) on delete cascade,
  dia       date not null,
  contagem  int  not null default 0,
  primary key (user_id, dia)
);

-- RLS ligada e SEM policies: ninguém acessa direto pelo app.
-- Só a Edge Function (service role) mexe aqui — ela ignora RLS.
alter table public.assistente_uso enable row level security;

-- Soma 1 no uso do dia e devolve a contagem nova (atômico).
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

-- Opcional: limpeza dos registros antigos (mais de 30 dias).
-- delete from public.assistente_uso where dia < (now() at time zone 'utc')::date - 30;
