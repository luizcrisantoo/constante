-- ============================================================
-- CONSTANTE — Fechar a tabela antiga "constante_state"
-- Rode UMA VEZ no Supabase: SQL Editor -> New query -> cole -> Run.
--
-- POR QUÊ: a "constante_state" é da época do modo pessoal (sync por
-- código). As policies dela liberavam leitura/escrita pra QUALQUER um
-- que tivesse a anon key (que é pública, vai no navegador de todo mundo).
-- No app COM LOGIN, ninguém usa essa tabela — os dados de cada conta
-- ficam na "constante_accounts" (essa sim, trancada por usuário).
--
-- O QUE ISSO FAZ: remove as policies abertas. Com a RLS ligada e SEM
-- policies, o anon key não lê nem escreve mais nada aqui. Os dados
-- antigos continuam guardados (nada é apagado) — só ficam selados.
-- É reversível e não afeta o app com login.
-- ============================================================

drop policy if exists "constante leitura" on public.constante_state;
drop policy if exists "constante escrita" on public.constante_state;
drop policy if exists "constante update"  on public.constante_state;

-- Garante que a RLS está ligada (bloqueia tudo que não tenha policy):
alter table public.constante_state enable row level security;

-- (Opcional, quando tiver certeza de que não quer mais o modo pessoal:
--  apaga a tabela de vez. Seus dados atuais NÃO estão aqui, estão em
--  constante_accounts. Descomente a linha abaixo só se quiser remover.)
-- drop table if exists public.constante_state;

-- Confirinho: depois de rodar, isto deve voltar VAZIO (0 linhas),
-- provando que o anon não enxerga mais nada:
--   (rode separado, se quiser testar pela REST com a anon key)
