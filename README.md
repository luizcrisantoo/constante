# 🟣 Constante

**Sua vida no ritmo certo — sem picos, sempre constante.**

O Constante é um app pessoal que junta num lugar só as coisas que costumam viver espalhadas: sua rotina, seus hábitos, sua dieta, seus treinos, suas finanças e sua cabeça. A ideia é simples — em vez de picos de motivação que somem em três dias, construir constância de verdade, um dia de cada vez. E constância, por aqui, **inclui recomeçar**: o app não cobra, não envergonha e não zera tua história por um dia ruim.

Funciona no celular e no computador (app web instalável — PWA), com os dados sincronizados entre aparelhos pela sua conta. Sem anúncio, sem venda de dados.

**App:** https://luizcrisantoo.github.io/constante/

---

## O que já dá pra fazer hoje

**☀️ Hoje** — o dia num relance: o que está rolando agora na rotina, hábitos com sequência e XP, check de treino de um toque ("Treinei hoje" — vale academia, corrida, futevôlei, o que for), refeições, remédios, água, sono e check-in de humor e energia. Quando você fica uns dias fora, o app te recebe com um recomeço leve — sem culpa.

**📅 Rotina** — a grade da semana inteira, com categorias personalizáveis (nome e cor). Blocos de treino têm atalho direto pras cargas.

**🏋️ Treinos** — fichas com semana A × semana B (pra quem alterna, ex.: padrão × metabólico), dia da semana por ficha, exercícios com histórico de séries × reps × carga (+ descanso) — na próxima vez, o app lembra quanto você fez da última.

**🍽️ Dieta** — o plano alimentar (o do seu nutricionista) organizado no app, com substituições e acompanhamento de peso.

**💰 Grana** — gastos do dia a dia por categoria, dívidas na fila bola de neve com projeção de quitação, e um plano opcional de redução gradual de um hábito (com o 🌊 de apoio pra quando bater a vontade).

**🧠 Mente** — sono da semana, humor e energia ao longo do tempo, radar de burnout e o surf do impulso (respiração guiada).

**📈 Progresso** — fotos privadas de evolução (com comparação lado a lado), peso e conquistas.

**🤖 Assistente** — organiza e ajusta o teu dia em linguagem natural, com botões de resposta rápida. Aceita **texto, foto e PDF**: manda a dieta do nutri ou a ficha do personal que ele encaixa tudo no app — refeições, treinos (com exercícios, semana A/B e dias), rotina e hábitos. **Ele não inventa dieta nem treino** — isso é com os teus profissionais; ele organiza o que você trouxer e ajusta quando você pedir.

**⚙️ Ajustes** — perfil com foto, metas, lembretes por notificação, backup (exportar/importar), central de novidades e conta com controle total: exportar tudo ou apagar a conta na hora (LGPD).

**☁️ Confiança** — a nuvenzinha no topo mostra se teus dados estão salvos na nuvem, avisa quando falta internet e re-sincroniza sozinha. Toda atualização importante do app é anunciada num card de Novidades.

---

## Pra onde o Constante está indo

Um passo de cada vez — sempre com a mesma régua: menos atrito, mais acolhimento. No radar: um começo de uso ainda mais guiado, apps nas lojas (App Store / Google Play) e integrações de saúde pra puxar sono e treino sozinhos. As novidades chegam primeiro dentro do app, no card ✨.

---

## Como é feito

App web puro (HTML, CSS e JavaScript vanilla) — sem framework, sem build, leve e instalável. Service worker pra funcionar offline e atualizar por versão de cache (`constante-vNN`).

**Backend:** Supabase — autenticação (com CAPTCHA Cloudflare Turnstile), banco Postgres com segurança por linha (**cada conta só lê e escreve os próprios dados, garantido pelo banco**), Storage privado pras fotos e Edge Function (Deno) pro assistente de IA, com limite diário de uso por pessoa.

**Métricas:** eventos de uso anônimos (PostHog, região UE) — só o *tipo* da ação, nunca conteúdo, valores ou dados de saúde.

**Estrutura:** `index.html` + `css/` + `js/` (`data` estado padrão e novidades · `core` regras e sync · `views*` telas · `script` ações · `assistente` chat IA · `auth` conta · `progresso` fotos · `notificacoes` push · `metrica` eventos) · `sw.js` cache · `assistente-edge-function.ts` (cola no Supabase ao alterar) · `supabase-*.sql` migrações.

**Segurança:** nenhum segredo no repositório — aqui só existem chaves publicáveis (feitas pra serem públicas); todas as chaves secretas vivem fora do código, no servidor.

**Processo de release:** mudou algo que o usuário percebe → bump do `CACHE` no `sw.js` + entrada nas `NOVIDADES` (`js/data.js`) + commit de uma linha (`vNN: resumo`) + push (GitHub Pages publica sozinho). Mexeu na Edge Function → colar e fazer Deploy no painel do Supabase.

---

*Feito com cuidado, começando por uma pessoa real e uma rotina real — hoje testado por um grupo de amigos. 🟣*
