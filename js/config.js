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
  supabaseUrl: '',   // ex.: 'https://abcd1234.supabase.co'
  supabaseKey: ''    // chave "anon public" (ou "publishable")
};
