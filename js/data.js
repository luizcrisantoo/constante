const DIAS_NOME = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
const DIAS_ABREV = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

function defaultState(){
  return {
    version: 3,
    criadoEm: hojeISO(),
    profile: {
      nome:'Luiz', peso:72.0, altura:174, nascimento:'2002-07-27',
      kcalAlvo:2700, protMin:145, aguaAlvoMl:2500,
      tmbMedida:1995, obsCalorimetria:'Calorimetria 15/08/2023 (65kg): TMB 1995 kcal · GET 3591 kcal na fase corrida+futevôlei+futsal. Fase atual (72kg, só musculação): alvo ~2700 kcal, energia constante.'
    },
    settings: {
      sono:{ deitar:'22:00', acordar:'05:30', deitarFds:'22:30', acordarFds:'06:30', melatonina:'21:40' },
      syncUrl:'', syncKey:'', syncCode:'', syncAuto:true, ultimaSync:null
    },
    pesos: [ { data: hojeISO(), kg: 72.0 } ],

    habits: [
      { id:'duo_en',  nome:'Duolingo Inglês',   icone:'🇬🇧', tipo:'fazer',  dias:[0,1,2,3,4,5,6], grupo:'Duolingo', xp:10 },
      { id:'duo_it',  nome:'Duolingo Italiano', icone:'🇮🇹', tipo:'fazer',  dias:[0,1,2,3,4,5,6], grupo:'Duolingo', xp:10 },
      { id:'duo_es',  nome:'Duolingo Espanhol', icone:'🇪🇸', tipo:'fazer',  dias:[0,1,2,3,4,5,6], grupo:'Duolingo', xp:10 },
      { id:'leitura', nome:'Leitura (20–30 min)', icone:'📖', tipo:'fazer', dias:[0,1,2,3,4,5,6], xp:15 },
      { id:'claude',  nome:'Estudo Claude / cursos de IA', icone:'🤖', tipo:'fazer', dias:[2,5,6], xp:20 },
      { id:'sites',   nome:'Demandas dos sites (Clifor/clínicas)', icone:'💼', tipo:'fazer', dias:[1,3,5], xp:15 },
      { id:'treino',  nome:'Academia', icone:'🏋️', tipo:'fazer', dias:[1,3,4,6], xp:20 },
      { id:'apostas', nome:'Sem apostas hoje', icone:'🎯', tipo:'evitar', dias:[0,1,2,3,4,5,6], xp:20,
        desc:'Plano de redução gradual ativo — registre qualquer aposta na aba Grana.' },
      { id:'jogos',   nome:'Sem jogos no PC', icone:'🕹️', tipo:'evitar', dias:[0,1,2,3,4,5,6], xp:15,
        desc:'Tempo de jogo vira leitura, curso ou descanso de verdade.' },
      { id:'scroll',  nome:'Sem scroll (só Insta profissional + LinkedIn)', icone:'📵', tipo:'evitar', dias:[0,1,2,3,4,5,6], xp:15,
        desc:'Redes sociais apenas com propósito profissional.' },
      { id:'foco',    nome:'Modo Foco 🔒', icone:'🔒', tipo:'evitar', dias:[0,1,2,3,4,5,6], xp:20, discreto:true,
        desc:'Hábito pessoal — só você sabe o que significa. Conta pra streak como os outros.' }
    ],

    routine: [

      {d:1,i:'05:30',f:'05:40',t:'Acordar + copo d’água',tipo:'sono'},
      {d:1,i:'05:40',f:'06:10',t:'Café da manhã + remédios da manhã',tipo:'refeicao',ref:'cafe'},
      {d:1,i:'06:45',f:'07:30',t:'Deslocamento → faculdade',tipo:'desloc'},
      {d:1,i:'07:30',f:'09:10',t:'Aula: Inteligência Artificial',tipo:'aula'},
      {d:1,i:'09:10',f:'09:40',t:'Volta pra casa',tipo:'desloc'},
      {d:1,i:'09:40',f:'10:00',t:'Lanche da manhã',tipo:'refeicao',ref:'lanche1'},
      {d:1,i:'10:00',f:'14:00',t:'Estágio (remoto — 4h)',tipo:'estagio'},
      {d:1,i:'14:00',f:'14:40',t:'Almoço + Vit. D e creatina',tipo:'refeicao',ref:'almoco'},
      {d:1,i:'14:40',f:'15:40',t:'Sites: Clifor / clínicas',tipo:'sites'},
      {d:1,i:'15:40',f:'16:10',t:'Duolingo (EN·IT·ES)',tipo:'idioma'},
      {d:1,i:'16:10',f:'16:40',t:'Deslocamento → faculdade',tipo:'desloc'},
      {d:1,i:'16:40',f:'18:20',t:'Aula: Língua Inglesa Instrumental',tipo:'aula'},
      {d:1,i:'18:35',f:'19:35',t:'Academia — Treino A (peito/ombro/tríceps + core)',tipo:'treino'},
      {d:1,i:'19:50',f:'20:20',t:'Jantar',tipo:'refeicao',ref:'jantar'},
      {d:1,i:'20:30',f:'21:00',t:'Leitura',tipo:'leitura'},
      {d:1,i:'21:00',f:'21:30',t:'Livre — sem telas',tipo:'livre'},
      {d:1,i:'21:30',f:'21:45',t:'Remédios da noite + melatonina 21:40',tipo:'remedios'},
      {d:1,i:'22:00',t:'💤 Dormir',tipo:'sono'},

      {d:2,i:'05:30',f:'05:40',t:'Acordar + copo d’água',tipo:'sono'},
      {d:2,i:'05:40',f:'06:10',t:'Café da manhã + remédios da manhã',tipo:'refeicao',ref:'cafe'},
      {d:2,i:'06:45',f:'07:30',t:'Deslocamento → faculdade',tipo:'desloc'},
      {d:2,i:'07:30',f:'09:10',t:'Aula: Programação Web e Mobile',tipo:'aula'},
      {d:2,i:'09:10',f:'09:40',t:'Lanche na faculdade',tipo:'refeicao',ref:'lanche1'},
      {d:2,i:'09:40',f:'11:10',t:'Estudo na faculdade (revisão/exercícios)',tipo:'estudo'},
      {d:2,i:'11:10',f:'12:50',t:'Aula: Análise de Algoritmos',tipo:'aula'},
      {d:2,i:'12:50',f:'13:20',t:'Volta pra casa',tipo:'desloc'},
      {d:2,i:'13:20',f:'14:00',t:'Almoço + Vit. D e creatina',tipo:'refeicao',ref:'almoco'},
      {d:2,i:'14:00',f:'14:30',t:'Pausa real (sem telas)',tipo:'pausa'},
      {d:2,i:'14:30',f:'15:30',t:'Estudo: Claude / cursos de IA',tipo:'estudo'},
      {d:2,i:'15:30',f:'16:00',t:'Duolingo (EN·IT·ES)',tipo:'idioma'},
      {d:2,i:'16:00',f:'17:00',t:'Sites ou estudo livre',tipo:'sites'},
      {d:2,i:'17:00',f:'17:30',t:'Lanche da tarde',tipo:'refeicao',ref:'lanche2'},
      {d:2,i:'17:50',f:'18:30',t:'Deslocamento → faculdade',tipo:'desloc'},
      {d:2,i:'18:30',f:'20:10',t:'Aula: Processamento Digital de Imagem',tipo:'aula'},
      {d:2,i:'20:10',f:'20:40',t:'Volta pra casa',tipo:'desloc'},
      {d:2,i:'20:40',f:'21:10',t:'Jantar leve',tipo:'refeicao',ref:'jantar'},
      {d:2,i:'21:10',f:'21:30',t:'Leitura',tipo:'leitura'},
      {d:2,i:'21:30',f:'21:45',t:'Remédios da noite + melatonina 21:40',tipo:'remedios'},
      {d:2,i:'22:00',t:'💤 Dormir',tipo:'sono'},

      {d:3,i:'05:30',f:'05:40',t:'Acordar + copo d’água',tipo:'sono'},
      {d:3,i:'05:40',f:'06:05',t:'Café da manhã + remédios da manhã',tipo:'refeicao',ref:'cafe'},
      {d:3,i:'06:50',f:'07:50',t:'Academia — Treino B (costas/bíceps + core)',tipo:'treino'},
      {d:3,i:'08:00',f:'08:20',t:'Lanche pós-treino',tipo:'refeicao',ref:'lanche1'},
      {d:3,i:'08:30',f:'12:30',t:'Estágio (remoto — 4h)',tipo:'estagio'},
      {d:3,i:'12:45',f:'13:25',t:'Almoço + Vit. D e creatina',tipo:'refeicao',ref:'almoco'},
      {d:3,i:'13:25',f:'13:55',t:'Pausa real (sem telas)',tipo:'pausa'},
      {d:3,i:'14:00',f:'15:00',t:'Estudo faculdade',tipo:'estudo'},
      {d:3,i:'15:00',f:'15:30',t:'Duolingo (EN·IT·ES)',tipo:'idioma'},
      {d:3,i:'15:35',f:'15:55',t:'Lanche da tarde',tipo:'refeicao',ref:'lanche2'},
      {d:3,i:'16:10',f:'16:40',t:'Deslocamento → faculdade',tipo:'desloc'},
      {d:3,i:'16:40',f:'18:20',t:'Aula: Língua Inglesa Instrumental',tipo:'aula'},
      {d:3,i:'18:20',f:'18:40',t:'Volta pra casa',tipo:'desloc'},
      {d:3,i:'18:40',f:'19:40',t:'Sites: Clifor / clínicas',tipo:'sites'},
      {d:3,i:'19:50',f:'20:20',t:'Jantar',tipo:'refeicao',ref:'jantar'},
      {d:3,i:'20:30',f:'21:00',t:'Leitura',tipo:'leitura'},
      {d:3,i:'21:30',f:'21:45',t:'Remédios da noite + melatonina 21:40',tipo:'remedios'},
      {d:3,i:'22:00',t:'💤 Dormir',tipo:'sono'},

      {d:4,i:'05:30',f:'05:40',t:'Acordar + copo d’água',tipo:'sono'},
      {d:4,i:'05:40',f:'06:10',t:'Café da manhã + remédios da manhã',tipo:'refeicao',ref:'cafe'},
      {d:4,i:'06:45',f:'07:30',t:'Deslocamento → faculdade',tipo:'desloc'},
      {d:4,i:'07:30',f:'09:10',t:'Aula: Inteligência Artificial',tipo:'aula'},
      {d:4,i:'09:10',f:'09:40',t:'Volta pra casa',tipo:'desloc'},
      {d:4,i:'09:40',f:'10:00',t:'Lanche da manhã',tipo:'refeicao',ref:'lanche1'},
      {d:4,i:'10:00',f:'14:00',t:'Estágio (remoto — 4h)',tipo:'estagio'},
      {d:4,i:'14:00',f:'14:40',t:'Almoço + Vit. D e creatina',tipo:'refeicao',ref:'almoco'},
      {d:4,i:'14:50',f:'15:50',t:'Academia — Treino C (pernas adaptado ao quadril)',tipo:'treino'},
      {d:4,i:'16:00',f:'16:30',t:'Duolingo (EN·IT·ES)',tipo:'idioma'},
      {d:4,i:'16:30',f:'17:10',t:'Estudo leve / folga',tipo:'estudo'},
      {d:4,i:'17:10',f:'17:30',t:'Lanche da tarde',tipo:'refeicao',ref:'lanche2'},
      {d:4,i:'17:50',f:'18:30',t:'Deslocamento → faculdade',tipo:'desloc'},
      {d:4,i:'18:30',f:'20:10',t:'Aula: Processamento Digital de Imagem',tipo:'aula'},
      {d:4,i:'20:10',f:'20:40',t:'Volta pra casa',tipo:'desloc'},
      {d:4,i:'20:40',f:'21:10',t:'Jantar leve',tipo:'refeicao',ref:'jantar'},
      {d:4,i:'21:10',f:'21:30',t:'Leitura',tipo:'leitura'},
      {d:4,i:'21:30',f:'21:45',t:'Remédios da noite + melatonina 21:40',tipo:'remedios'},
      {d:4,i:'22:00',t:'💤 Dormir',tipo:'sono'},

      {d:5,i:'05:30',f:'05:40',t:'Acordar + copo d’água',tipo:'sono'},
      {d:5,i:'05:40',f:'06:10',t:'Café da manhã + remédios da manhã',tipo:'refeicao',ref:'cafe'},
      {d:5,i:'06:45',f:'07:30',t:'Deslocamento → faculdade',tipo:'desloc'},
      {d:5,i:'07:30',f:'09:10',t:'Aula: Programação Web e Mobile',tipo:'aula'},
      {d:5,i:'09:10',f:'09:40',t:'Lanche na faculdade',tipo:'refeicao',ref:'lanche1'},
      {d:5,i:'09:40',f:'11:10',t:'Estudo na faculdade (revisão/exercícios)',tipo:'estudo'},
      {d:5,i:'11:10',f:'12:50',t:'Aula: Análise de Algoritmos',tipo:'aula'},
      {d:5,i:'12:50',f:'13:20',t:'Volta pra casa',tipo:'desloc'},
      {d:5,i:'13:20',f:'14:00',t:'Almoço + Vit. D e creatina',tipo:'refeicao',ref:'almoco'},
      {d:5,i:'14:00',f:'14:30',t:'Pausa real (sem telas)',tipo:'pausa'},
      {d:5,i:'14:30',f:'15:00',t:'Duolingo (EN·IT·ES)',tipo:'idioma'},
      {d:5,i:'15:00',f:'16:00',t:'Sites: fechamento da semana',tipo:'sites'},
      {d:5,i:'16:00',f:'17:00',t:'Estudo: Claude / cursos de IA',tipo:'estudo'},
      {d:5,i:'17:00',f:'17:30',t:'Lanche da tarde',tipo:'refeicao',ref:'lanche2'},
      {d:5,i:'19:30',f:'20:00',t:'Jantar',tipo:'refeicao',ref:'jantar'},
      {d:5,i:'20:00',f:'22:00',t:'Noite livre 🎉 (social / lazer offline)',tipo:'livre'},
      {d:5,i:'22:15',f:'22:30',t:'Remédios da noite + melatonina',tipo:'remedios'},
      {d:5,i:'22:30',t:'💤 Dormir (flex)',tipo:'sono'},

      {d:6,i:'06:30',f:'06:45',t:'Acordar (flex) + copo d’água',tipo:'sono'},
      {d:6,i:'06:45',f:'07:00',t:'⚖️ Pesagem semanal (em jejum)',tipo:'revisao'},
      {d:6,i:'07:00',f:'07:30',t:'Café da manhã + remédios da manhã',tipo:'refeicao',ref:'cafe'},
      {d:6,i:'08:00',f:'09:00',t:'Academia — Treino D (upper leve + mobilidade)',tipo:'treino'},
      {d:6,i:'09:15',f:'09:35',t:'Lanche pós-treino',tipo:'refeicao',ref:'lanche1'},
      {d:6,i:'09:45',f:'11:45',t:'Bloco profundo: cursos / projetos / Claude',tipo:'estudo'},
      {d:6,i:'12:30',f:'13:10',t:'Almoço + Vit. D e creatina',tipo:'refeicao',ref:'almoco'},
      {d:6,i:'14:00',f:'15:00',t:'Sites (se houver pendência)',tipo:'sites'},
      {d:6,i:'15:00',f:'15:30',t:'Duolingo (EN·IT·ES)',tipo:'idioma'},
      {d:6,i:'15:30',f:'16:00',t:'Lanche da tarde',tipo:'refeicao',ref:'lanche2'},
      {d:6,i:'16:00',f:'17:00',t:'Leitura longa',tipo:'leitura'},
      {d:6,i:'17:00',f:'22:00',t:'Livre 🎉',tipo:'livre'},
      {d:6,i:'19:30',f:'20:00',t:'Jantar',tipo:'refeicao',ref:'jantar'},
      {d:6,i:'22:30',t:'💤 Dormir (flex)',tipo:'sono'},

      {d:0,i:'06:30',f:'07:00',t:'Acordar (flex) + copo d’água',tipo:'sono'},
      {d:0,i:'07:00',f:'07:30',t:'Café da manhã + remédios da manhã',tipo:'refeicao',ref:'cafe'},
      {d:0,i:'08:00',f:'08:30',t:'Duolingo (EN·IT·ES)',tipo:'idioma'},
      {d:0,i:'08:30',f:'09:30',t:'Leitura',tipo:'leitura'},
      {d:0,i:'09:30',f:'12:30',t:'Manhã livre',tipo:'livre'},
      {d:0,i:'12:30',f:'13:10',t:'Almoço + Vit. D e creatina',tipo:'refeicao',ref:'almoco'},
      {d:0,i:'13:10',f:'18:00',t:'Tarde livre / família',tipo:'livre'},
      {d:0,i:'16:30',f:'17:00',t:'Lanche da tarde',tipo:'refeicao',ref:'lanche2'},
      {d:0,i:'18:00',f:'18:40',t:'🧭 Revisão semanal (finanças, apostas, humor, próxima semana)',tipo:'revisao'},
      {d:0,i:'19:30',f:'20:00',t:'Jantar',tipo:'refeicao',ref:'jantar'},
      {d:0,i:'21:00',f:'21:30',t:'Preparar a segunda (mochila, roupa, lista)',tipo:'revisao'},
      {d:0,i:'21:30',f:'21:45',t:'Remédios da noite + melatonina 21:40',tipo:'remedios'},
      {d:0,i:'22:00',t:'💤 Dormir',tipo:'sono'}
    ],

    diet: {
      alvo:'≈2.700 kcal/dia · proteína ≥145g (alvo real ~180g) · carbo de baixo/médio IG distribuído — energia constante, sem picos.',
      aviso:'Plano orientativo montado a partir da sua calorimetria e do plano do nutricionista Gabriel Januzzi (ago/2024), ajustado para a fase SEM corrida/futevôlei. Valide com ele, principalmente antes da cirurgia. Sem maltodextrina e sem leite condensado nesta fase (eram combustível de treino de corrida).',
      refeicoes: [
        { id:'cafe', nome:'Café da manhã', hora:'05:40', kcal:660, prot:37,
          itens:['2 pães franceses (100g)','3 ovos mexidos','2 fatias de muçarela (40g)','1 fruta (banana, maçã ou mamão)'],
          subs:['Pão → cuscuz 265g · tapioca 105g · pão integral 4 fatias · batata-doce 330g','Ovos → frango desfiado 140g · atum 155g','Queijo → requeijão 50g'] },
        { id:'lanche1', nome:'Lanche da manhã', hora:'09:40', kcal:400, prot:30,
          itens:['Shake: whey 30g + banana + aveia 20g + leite 200ml'],
          subs:['Na facul (ter/sex): sanduíche de pão integral (2 fatias) + frango 50g + requeijão 30g + 1 fruta','Pós-treino (qua/sáb): mesmo shake, tomar logo após o treino'] },
        { id:'almoco', nome:'Almoço', hora:'13:00–14:00', kcal:800, prot:50,
          itens:['Arroz branco 150g','Feijão 140g (qualquer tipo)','Frango grelhado 150g','Salada e legumes à vontade','Azeite 1 c. sopa','Farofa 15g (opcional)'],
          subs:['Arroz → macarrão 135g · arroz integral 150g · macaxeira 140g · batata-doce 180g · inhame 190g','Frango → patinho 105g · tilápia 210g · salmão 95g · sobrecoxa s/ pele 95g','Feijão → lentilha 95g · grão de bico 80g'] },
        { id:'lanche2', nome:'Lanche da tarde', hora:'16:30–17:30', kcal:430, prot:22,
          itens:['Sanduíche: pão integral 2 fatias + frango 50g + requeijão 30g','1 maçã','Castanha de caju 15g (dias de treino)'],
          subs:['Ou vitamina: leite 250ml + banana + aveia 15g + whey 20g','Ou bolo proteico do nutri (aveia 20g + cacau + whey 30g + leite 50ml)'] },
        { id:'jantar', nome:'Jantar', hora:'19:30–20:40', kcal:500, prot:42,
          itens:['Macarrão 200g (ou arroz 150g)','Frango 130g','Legumes refogados'],
          subs:['Ter/qui (chegando 20:40): 2 tapiocas com frango 100g e queijo — rápido e leve','Opção hambúrguer caseiro (sex/sáb): pão 50g + patinho 110g + requeijão + muçarela','Frango → 3 ovos · patinho 91g · tilápia 182g'] }
      ],
      hidratacao:'Meta 2,5L de água/dia (35ml/kg). Garrafa cheia no início de cada bloco da rotina.',
      constante:['Sem picos: nada de doce/refri isolado no meio do dia — sobremesa pequena junto de refeição completa, se quiser.','Café: ok até 14:00 no máximo (protege o sono das 22:00).','Proteína em TODAS as refeições = saciedade e glicemia estável.']
    },

    meds: {
      aviso:'Horários sugeridos por praxe comum — confirme dose e frequência com seu médico (principalmente Reconter e Dymista, que são de prescrição).',
      grupos: [
        { id:'med_manha', nome:'Manhã (no café — 05:40)', itens:['Reconter (conforme prescrição)','Dymista — 1 jato/narina','NAC','Vitamina C','Colágeno tipo II'] },
        { id:'med_almoco', nome:'Almoço', itens:['Vitamina D (com a refeição — melhor absorção)','Creatina 3–5g (todo dia, mesmo sem treino)'] },
        { id:'med_noite', nome:'Noite (21:30)', itens:['Mag-3 Complex (magnésio)','Dymista — 2ª dose (se prescrito 2x/dia)','Melatonina às 21:40 (~20 min antes de deitar)'] }
      ]
    },

    finance: {
      rendas:[ {nome:'Estágio', valor:1400}, {nome:'Site Clínica Ortopédica do Recife', valor:200} ],
      aporteMensal:700,
      metodo:'snowball',
      dividas:[
        { id:'caua',  nome:'Cauã',   total:440.00,  pagos:[] },
        { id:'yuri',  nome:'Yuri',   total:495.00,  pagos:[] },
        { id:'malu',  nome:'Malu',   total:1338.23, pagos:[] },
        { id:'caio',  nome:'Caio',   total:3000.00, pagos:[] },
        { id:'painho',nome:'Painho', total:3000.00, pagos:[] }
      ],
      extras:[]
    },

    bets: {
      inicioPlano: hojeISO(),
      limiteSemanaInicial: 50,
      semanasParaZero: 8,
      nota:'Redução gradual, sem corte seco: o limite semanal cai a cada semana até zerar. Tudo que você NÃO apostar pode virar pagamento de dívida com 1 toque.'
    },

    treinos: {
      aviso:'Pré-cirurgia do quadril: regra nº1 é ZERO dor no quadril. Combine as adaptações com o professor da academia (e fisio, se tiver). Registre treino e sono pela pulseira Polar Loop e lance aqui o resumo.',
      split:[
        {id:'a', dia:'Seg 18:35', nome:'Treino A', foco:'Peito, ombro e tríceps + core', exercicios:[]},
        {id:'b', dia:'Qua 06:50', nome:'Treino B', foco:'Costas e bíceps + core', exercicios:[]},
        {id:'c', dia:'Qui 14:50', nome:'Treino C', foco:'Pernas ADAPTADO (máquinas, amplitude sem dor, sem impacto)', exercicios:[]},
        {id:'d', dia:'Sáb 08:00', nome:'Treino D', foco:'Upper leve + mobilidade e alongamento', exercicios:[]}
      ]
    },

    gastos: {
      categorias:[
        {id:'g_alim', nome:'Alimentação', icone:'🍔', cor:'var(--c-refeicao)'},
        {id:'g_transp', nome:'Transporte', icone:'🚗', cor:'var(--c-aula)'},
        {id:'g_lazer', nome:'Lazer', icone:'🎮', cor:'var(--c-sites)'},
        {id:'g_saude', nome:'Saúde', icone:'💊', cor:'var(--c-estagio)'},
        {id:'g_casa', nome:'Casa/contas', icone:'🏠', cor:'var(--c-estudo)'},
        {id:'g_outros', nome:'Outros', icone:'📦', cor:'var(--c-livre)'}
      ],
      lancamentos:[]
    },

    estudo: {
      cadernos:[
        {id:'e_ia', nome:'Inteligência Artificial', notas:[]},
        {id:'e_algo', nome:'Análise de Algoritmos', notas:[]},
        {id:'e_web', nome:'Programação Web e Mobile', notas:[]},
        {id:'e_pdi', nome:'Processamento Digital de Imagem', notas:[]},
        {id:'e_ing', nome:'Língua Inglesa Instrumental', notas:[]},
        {id:'e_claude', nome:'Cursos de IA / Claude', notas:[]}
      ]
    },

    days: {},
    gamif: { xpTotal:0, conquistas:[] }
  };
}

const CONQUISTAS = [
  { id:'primeiro_dia',  nome:'Primeiro passo',      icone:'👣', desc:'Complete seu primeiro dia com 80+ XP' },
  { id:'streak7',       nome:'Uma semana constante', icone:'🔥', desc:'7 dias seguidos de ofensiva' },
  { id:'streak30',      nome:'Mês constante',        icone:'🌟', desc:'30 dias seguidos de ofensiva' },
  { id:'sono7',         nome:'Sono em dia',          icone:'😴', desc:'Registre 7 noites de sono' },
  { id:'agua7',         nome:'Hidratado',            icone:'💧', desc:'Bata a meta de água 7 dias (não precisa ser seguidos)' },
  { id:'semana_zero',   nome:'Semana limpa',         icone:'🎯', desc:'Uma semana inteira sem apostar' },
  { id:'divida1',       nome:'Primeira dívida quitada', icone:'✂️', desc:'Quite a primeira dívida da lista' },
  { id:'metade_divida', nome:'Metade do caminho',    icone:'⛰️', desc:'Pague 50% do total das dívidas' },
  { id:'livre',         nome:'Livre de dívidas',     icone:'🕊️', desc:'Quite tudo' },
  { id:'treino16',      nome:'Corpo constante',      icone:'💪', desc:'16 treinos registrados' },
  { id:'leitor',        nome:'Leitor de verdade',    icone:'📚', desc:'20 dias de leitura' },
  { id:'poliglota',     nome:'Poliglota',            icone:'🌍', desc:'Duolingo completo (3 línguas) por 14 dias' }
];

const NIVEIS = [
  { xp:0,    nome:'Começo',   icone:'🌱' },
  { xp:300,  nome:'Bronze',   icone:'🥉' },
  { xp:800,  nome:'Prata',    icone:'🥈' },
  { xp:1600, nome:'Ouro',     icone:'🥇' },
  { xp:3000, nome:'Diamante', icone:'💎' },
  { xp:5000, nome:'Constante',icone:'🟣' }
];

const FRASES = [
  'Constância vence intensidade.',
  'Você não precisa de um dia perfeito. Precisa de um dia feito.',
  'Cada real não apostado é um tijolo da sua liberdade.',
  'Sono é treino, estudo e terapia — tudo ao mesmo tempo.',
  'O Luiz de 2027 agradece o que você fizer hoje.',
  'Menos picos, mais progresso.',
  'Feito é melhor que perfeito.',
  'Sua streak não quebra num dia ruim. Quebra quando você desiste.'
];
