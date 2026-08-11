/* ============================================================
   CONSTANTE — configuração do produto
   ------------------------------------------------------------
   VAZIO      → modo local/pessoal: sem login, dados no aparelho
                (e sync por código, se configurada) — como sempre foi.
   PREENCHIDO → modo produto: login obrigatório, dados por conta
                protegidos por RLS no Supabase.

   Estes dois valores são PÚBLICOS por design (vão pro navegador
   de todo usuário). A proteção real é a RLS por usuário no banco.
   NUNCA coloque aqui a service_role key.
   ============================================================ */
'use strict';
const CONSTANTE_CONFIG = {
  supabaseUrl: 'https://piiigvazptshbdfgdngw.supabase.co',   // ex.: 'https://abcd1234.supabase.co'
  supabaseKey: 'sb_publishable_rakIQQex76e44mPLh-ldnA_7kQw2Snc'    // chave "anon public" (ou "publishable")
};
