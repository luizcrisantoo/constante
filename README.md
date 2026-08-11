# 🟣 Constante

**Sua vida no ritmo certo.** App pessoal de rotina, hábitos, dieta, finanças e foco — feito sob medida pro Luiz, com arquitetura pronta pra evoluir pra produto.

## O que tem dentro

| Aba | Função |
|---|---|
| ☀️ **Hoje** | Bloco atual da rotina, hábitos com streak/XP (estilo Duolingo), refeições, remédios, água, sono (Polar Loop), check-in de humor/energia |
| 📅 **Rotina** | Grade semanal completa (aulas, estágio, treinos, estudo, sites, idiomas, sono) — 100% editável |
| 🍽️ **Dieta** | Plano de ~2.700 kcal (fase sem corrida), substituições do nutricionista, regras de energia constante, evolução do peso |
| 💰 **Grana** | Dívidas com método bola de neve, projeção de quitação, plano de **redução gradual de apostas** com limite semanal decrescente e conversão de economia em pagamento |
| 🧠 **Mente** | Sono da semana, humor/energia 14 dias, radar de burnout, surf do impulso (respiração 4-7-8), conquistas |
| ⚙️ **Config** | Tudo editável + sincronização Supabase + backup |

## Stack (padrão GSD PRO)

- HTML/CSS/JS **puro**, zero dependências, zero build.
- PWA: instala no celular e no notebook, funciona offline (service worker).
- Sync opcional via **Supabase REST** (sem SDK) — offline-first com mesclagem inteligente (nunca perde um check feito no outro aparelho).
- Segurança: sem `innerHTML` com dado externo sem escape, sem `eval`, RLS no banco.

```
/app
├── index.html
├── favicon.ico
├── manifest.webmanifest        # PWA
├── sw.js                       # service worker (offline)
├── supabase-setup.sql          # cria a tabela de sync
├── GUIA-PUBLICACAO.md          # como publicar em ~10 min
├── /assets/icons               # ícones do app
├── /css
│   ├── variables.css           # design tokens (tema)
│   └── styles.css
└── /js
    ├── data.js                 # SEUS dados padrão (rotina, dieta, dívidas…)
    ├── core.js                 # estado, XP, streaks, finanças, sync
    ├── ui.js                   # modal, toast, respiração SOS
    ├── views.js                # telas: Hoje, Rotina, Dieta
    ├── views2.js               # telas: Grana, Mente, Config
    └── script.js               # eventos e boot
```

## Rodar local

```bash
cd app && python3 -m http.server 8080
# abre http://localhost:8080
```

## Roadmap v2 (se virar produto)

- Login multiusuário (Supabase Auth) — policies já esboçadas no SQL.
- Notificações push (lembrete de remédio/melatonina).
- Integração Polar AccessLink (sono/treino automáticos).
- Onboarding genérico (hoje o `data.js` é o "perfil do Luiz" — vira wizard de primeiro uso).
