-- ============================================================
-- CONSTANTE — Cofre de fotos de progresso (Storage privado)
-- Rode isto UMA VEZ no Supabase: SQL Editor -> cole -> Run.
-- Cria o bucket "progresso" (privado) e as regras pra cada
-- pessoa só acessar as PRÓPRIAS fotos (a pasta é o id do usuário).
-- ============================================================

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
