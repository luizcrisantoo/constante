create table if not exists public.constante_accounts (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  payload    jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.constante_accounts enable row level security;

create policy "conta: dono le" on public.constante_accounts
  for select to authenticated using (auth.uid() = user_id);
create policy "conta: dono insere" on public.constante_accounts
  for insert to authenticated with check (auth.uid() = user_id);
create policy "conta: dono atualiza" on public.constante_accounts
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

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