# 🟣 Constante — Guia de publicação (±10 minutos)

O app é 100% estático (HTML/CSS/JS puro): funciona em **qualquer hospedagem**, inclusive a que você já usa pros sites dos seus clientes. A sincronização celular ↔ notebook usa o **Supabase** (grátis).

---

## Parte 1 — Publicar o site

### Opção A: na sua própria hospedagem (mais rápido pra você)
1. Sobe a pasta inteira do app (com `index.html` na raiz ou numa subpasta, ex.: `constante/`) via FTP/painel, igual você faz com os sites da Clifor.
2. Acessa a URL (ex.: `https://seudominio.com.br/constante/`). Pronto.
3. **Importante:** precisa ser **HTTPS** pro modo app (PWA) e pro service worker funcionarem.

### Opção B: GitHub Pages (grátis, sem servidor)
1. Cria um repositório **privado não funciona no plano free do Pages** → cria um repositório **público** chamado `constante` (os seus dados NÃO ficam no repositório — só o código; os dados ficam no seu navegador e no seu Supabase).
2. Sobe todos os arquivos da pasta do app (arrasta e solta na interface do GitHub, se quiser).
3. No repositório: **Settings → Pages → Branch: `main` / pasta `/ (root)` → Save**.
4. Em ~1 minuto o app fica em `https://SEU-USUARIO.github.io/constante/`.

---

## Parte 2 — Sincronização (Supabase, grátis)

1. Cria conta em **supabase.com** → **New project** (nome: `constante`; região: `South America (São Paulo)`; guarda a senha do banco, mas não vamos precisar dela no app).
2. No projeto, abre o **SQL Editor** → cola o conteúdo do arquivo **`supabase-setup.sql`** → **Run**. (Cria a tabela de sincronização com RLS ligado.)
3. Vai em **Project Settings → API** e copia:
   - **Project URL** (ex.: `https://abcd1234.supabase.co`)
   - **anon public key** (aquele token grandão `eyJ...`)
4. No app: **⚙️ Config → Sincronização** e preenche:
   - URL do projeto
   - Chave anon
   - **Código de sincronização**: inventa um código LONGO e único (ex.: `luiz-constante-2026-x7k9q`). **Trata ele como senha** — é ele que separa/protege seus dados.
5. Aperta **🔄 sincronizar agora**. Feito.
6. **No celular:** abre a mesma URL do app, preenche os MESMOS três campos e aperta **⬇ baixar da nuvem**. A partir daí, tudo que marcar num aparelho aparece no outro (sync automática ao salvar + botão manual).

> Modo offline: o app funciona sem internet (dados ficam no aparelho) e sincroniza quando a conexão voltar e você abrir/marcar algo.

---

## Parte 3 — Instalar como aplicativo

- **Android (Chrome):** abre a URL → menu ⋮ → **"Adicionar à tela inicial"** / **"Instalar app"**.
- **iPhone (Safari):** abre a URL → botão compartilhar → **"Adicionar à Tela de Início"**.
- **Notebook (Chrome/Edge):** ícone de instalar na barra de endereço → **Instalar Constante**.

Vira um app de verdade: ícone, tela cheia, funciona offline.

---

## Segurança (leitura de 30 segundos)

- Modelo de uso pessoal: quem tiver a **URL do seu projeto + anon key** consegue acessar a tabela de sync. Então: **não compartilha nenhum dos três dados** (URL, chave, código) e pronto — eles só existem nos seus 2 aparelhos.
- O app **não** envia suas chaves nem seu código dentro dos dados sincronizados.
- Se um dia for vender o app, o `supabase-setup.sql` já traz o modelo com login (Supabase Auth), que fecha o acesso por usuário de verdade.
- Backup manual: **Config → exportar backup** de vez em quando (gera um JSON).

---

## Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| "Falha ao enviar (404)" | SQL não rodado | Roda o `supabase-setup.sql` no SQL Editor |
| "Falha ao enviar (401)" | Chave errada | Copia de novo a **anon public** em Settings → API |
| Não aparece "instalar app" | Sem HTTPS | Usa GitHub Pages ou ativa SSL na hospedagem |
| Dados diferentes nos aparelhos | Sync manual pendente | Aperta 🔄 nos dois; o app mescla sem perder nada |
