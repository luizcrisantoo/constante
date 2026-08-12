-- ============================================================
-- CONSTANTE — Apagar conta INCLUINDO as fotos de progresso
-- Rode UMA VEZ no Supabase: SQL Editor -> New query -> cole -> Run.
--
-- POR QUÊ: a versão antiga do delete_my_account() apagava a conta e,
-- por cascata, as tabelas (constante_accounts, push_subs, assistente_uso).
-- Mas as FOTOS ficam no Storage, que NÃO tem cascata — então elas
-- sobreviviam à exclusão. Isso contradiz a Política de Privacidade, que
-- promete apagar "todos os seus dados do servidor". Esta versão apaga as
-- fotos antes de remover a conta.
--
-- É um "create or replace": seguro rodar por cima da função atual.
-- ============================================================

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

  -- 1) apaga as fotos de progresso do usuário no Storage (a pasta é o id do usuário)
  delete from storage.objects
   where bucket_id = 'progresso'
     and (storage.foldername(name))[1] = auth.uid()::text;

  -- 2) apaga o usuário — a cascata cuida de constante_accounts, push_subs e assistente_uso
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
