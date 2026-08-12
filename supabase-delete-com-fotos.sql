-- ============================================================
-- CONSTANTE — Apagar conta (VERSÃO CORRIGIDA)
-- Rode UMA VEZ no Supabase: SQL Editor -> New query -> cole -> Run.
--
-- IMPORTANTE: o Supabase NÃO permite apagar direto de storage.objects
-- pelo SQL ("Direct deletion from storage tables is not allowed"). Por isso
-- esta função voltou a apagar SOMENTE a conta. As fotos de progresso agora
-- são apagadas pelo próprio app (via Storage API) ANTES de chamar esta
-- função — veja apagarFotosDoUsuario() em js/progresso.js.
--
-- É um "create or replace": seguro rodar por cima da versão que quebrou.
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

  -- apaga o usuário — a cascata cuida de constante_accounts, push_subs e assistente_uso
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
