'use strict';
const DIAS_NOME = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
const DIAS_ABREV = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
// Onboarding por intenção: o que a pessoa veio buscar → o que o app já deixa pronto.
const INTENCOES = [
  {id:'treino', icone:'💪', nome:'Treinar com constância'},
  {id:'comer',  icone:'🍽️', nome:'Comer melhor'},
  {id:'agua',   icone:'💧', nome:'Beber mais água'},
  {id:'sono',   icone:'😴', nome:'Dormir melhor'},
  {id:'estudo', icone:'📚', nome:'Estudar / organizar o dia'},
  {id:'grana',  icone:'💰', nome:'Controlar a grana'},
  {id:'cabeca', icone:'🧠', nome:'Cuidar da cabeça'},
  {id:'aposta', icone:'🎯', nome:'Reduzir apostas'}
];
// Sugestões — não são receita: a pessoa tira o que não faz sentido antes de começar.
const SUGESTOES_HABITO = {
  treino:[{icone:'🤸',nome:'Alongar 10 min',tipo:'fazer'},{icone:'🚶',nome:'Caminhar 20 min',tipo:'fazer'}],
  comer :[{icone:'🍎',nome:'Comer uma fruta',tipo:'fazer'},{icone:'🥤',nome:'Refrigerante',tipo:'evitar'}],
  agua  :[{icone:'💧',nome:'Garrafa de água por perto',tipo:'fazer'}],
  sono  :[{icone:'🌙',nome:'Dormir antes das 00h',tipo:'fazer'},{icone:'📵',nome:'Celular na cama',tipo:'evitar'}],
  estudo:[{icone:'📚',nome:'Estudar 30 min',tipo:'fazer'},{icone:'📖',nome:'Ler 10 páginas',tipo:'fazer'}],
  grana :[{icone:'🧾',nome:'Anotar os gastos do dia',tipo:'fazer'}],
  cabeca:[{icone:'🧘',nome:'Respirar 3 min',tipo:'fazer'},{icone:'📝',nome:'Escrever como foi o dia',tipo:'fazer'}],
  aposta:[{icone:'🎯',nome:'Apostar',tipo:'evitar'}]
};
const MESES_NOME = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const UNIDADES = {
  min: { nome:'minutos', abrev:'min' },
  vez: { nome:'vezes',   abrev:'x'   },
  brl: { nome:'reais',   abrev:'R$'  }
};

function defaultState(){
  return {
    version: 4,
    criadoEm: hojeISO(),
    profile: {
      nome:'', foto:null, peso:null, altura:null, nascimento:'',
      kcalAlvo:null, protMin:null, aguaAlvoMl:null,
      tmbMedida:null, obsCalorimetria:''
    },
    settings: {
      sono:{ deitar:'23:00', acordar:'07:00', deitarFds:'23:30', acordarFds:'08:00', melatonina:'' },
      syncUrl:'', syncKey:'', syncCode:'', syncAuto:true, ultimaSync:null,
      onboard:{ feito:false, intencoes:[], vitoria:'' }
    },
    pesos: [],
    habits: [],
    routine: [],
    diet: {
      alvo:'',
      aviso:'',
      refeicoes: [],
      hidratacao:'Recomendação comum: cerca de 35 ml de água por kg de peso por dia.',
      constante:[]
    },
    meds: {
      aviso:'Cadastre seus remédios e suplementos, com os horários de tomar.',
      grupos: []
    },
    finance: {
      rendas:[],
      aporteMensal:0,
      metodo:'snowball',
      dividas:[],
      extras:[]
    },
    bets: {
      inicioPlano: hojeISO(),
      alvo: '',
      unidade: 'min',
      limiteSemanaInicial: 0,
      semanasParaZero: 8,
      ativo: false,
      nota:'Redução gradual, sem corte seco: o limite semanal cai a cada semana até a meta.'
    },
    treinos: {
      aviso:'Monte seus treinos e registre as cargas de cada exercício — na próxima vez o app te lembra da última.',
      split:[
        {id:'a', dia:'', nome:'Treino A', foco:'', exercicios:[]},
        {id:'b', dia:'', nome:'Treino B', foco:'', exercicios:[]},
        {id:'c', dia:'', nome:'Treino C', foco:'', exercicios:[]},
        {id:'d', dia:'', nome:'Treino D', foco:'', exercicios:[]}
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
      cadernos:[]
    },
    progresso: [],
    lembretes: [],
    categorias: [
      {id:'aula', nome:'Aula', cor:'#3987e5'},
      {id:'estagio', nome:'Estágio', cor:'#199e70'},
      {id:'treino', nome:'Treino', cor:'#d95926'},
      {id:'refeicao', nome:'Refeição', cor:'#c98500'},
      {id:'estudo', nome:'Estudo', cor:'#9085e9'},
      {id:'sites', nome:'Sites', cor:'#d55181'},
      {id:'idioma', nome:'Idiomas', cor:'#3987e5'},
      {id:'leitura', nome:'Leitura', cor:'#199e70'},
      {id:'sono', nome:'Sono', cor:'#6d6a8f'},
      {id:'livre', nome:'Livre', cor:'#565550'},
      {id:'pausa', nome:'Pausa', cor:'#565550'},
      {id:'desloc', nome:'Deslocamento', cor:'#45443f'},
      {id:'remedios', nome:'Remédios', cor:'#e66767'},
      {id:'revisao', nome:'Revisão', cor:'#c98500'}
    ],
    days: {},
    gamif: { xpTotal:0, conquistas:[] }
  };
}

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
  'Cada passo pequeno é um tijolo da sua liberdade.',
  'Sono é treino, estudo e terapia — tudo ao mesmo tempo.',
  'O você de 2027 agradece o que você fizer hoje.',
  'Menos picos, mais progresso.',
  'Feito é melhor que perfeito.',
  'Sua ofensiva não quebra num dia ruim. Quebra quando você desiste.'
];

// ============================================================
// NOVIDADES — o que mudou a cada atualização grande.
// A entrada mais NOVA fica em primeiro. "v" acompanha a versão do
// service worker (sw.js). Só entra aqui o que o usuário percebe:
// escreve o BENEFÍCIO, em português de gente, sem jargão técnico.
// ============================================================
const NOVIDADES = [
  { v:42, data:'2026-08-14', titulo:'Calendário na Grana', itens:[
    '📅 A Grana agora tem calendário do mês: cada dia mostra quanto saiu, e tocando num dia você abre ele — vê os gastos daquele dia e lança direto ali. Esqueceu terça? Toca na terça e anota.',
    '💰 O botão de registrar já vem com o dia que você abriu, e depois de salvar o app te mostra o dia onde o gasto caiu.'
  ]},
  { v:41, data:'2026-08-14', titulo:'Dá pra experimentar sem criar conta', itens:[
    '🔓 Quem chega agora pode usar o app inteiro antes de criar conta — e quando criar, o que já foi anotado vai junto pra conta.',
    '👋 Tem uma abertura nova: o app pergunta teu nome e o que te trouxe aqui, e já deixa pronto o que importa pra você (sem receita de bolo — dá pra tirar o que não faz sentido na hora).',
    '🎯 E te empurra pra primeira vitória: marcar uma coisa só, hoje. É assim que a linha começa.'
  ]},
  { v:40, data:'2026-08-14', titulo:'Empurrar treino, repetir ontem e meses na Grana', itens:[
    '⏭ Não deu pra treinar hoje? Agora dá pra empurrar a ficha pra amanhã — ela aparece no dia seguinte e você não perde o músculo da semana. Some sozinho depois.',
    '↩️ De manhã, se o dia for igual ao de ontem, o botão “Repetir ontem” marca os mesmos hábitos, refeições e remédios de uma vez (água, sono e humor ficam de fora — esses são de hoje).',
    '📅 Na Grana dá pra navegar pelos meses anteriores: totais, categorias e extrato de julho, junho, o que for.'
  ]},
  { v:39, data:'2026-08-13', titulo:'Gastos de qualquer dia', itens:[
    '💰 Esqueceu de anotar um gasto? Agora o registro tem campo de DIA — dá pra lançar o de ontem, o de sábado, a semana inteira de uma vez.',
    '📅 E a Grana ganhou extrato: a lista mostra os últimos 7 dias e dá pra abrir o mês inteiro, dia a dia, com o total de cada dia — e remover qualquer lançamento.'
  ]},
  { v:38, data:'2026-08-13', titulo:'Moldura de recorde + app mais vivo', itens:[
    '🖼 Tua foto de perfil ganhou MOLDURA de recorde: 🌱 Semente → 🥉 Bronze (7 dias) → 🥈 Prata (30) → 🥇 Ouro (100) → 🟣 Ametista (365). Ela mostra a tua MELHOR sequência de todos os tempos e nunca rebaixa — chegou no ouro, é teu até você se superar. Toca na foto pra ver tua escada.',
    '✨ O app ganhou vida: check com animação e vibração no celular, transição suave entre as abas e aviso quando você bate um novo recorde pessoal.',
    '😴 Sono mais esperto: ajustou o horário de deitar/acordar? As horas dormidas recalculam na hora (e se você digitar as horas na mão, o app respeita e não mexe).'
  ]},
  { v:37, data:'2026-08-13', titulo:'Fichas destravadas + assistente organiza exercícios', itens:[
    '🧩 Conserto importante: fichas de treino antigas (sem identidade interna) voltaram a abrir e editar — o toque nelas funciona de novo.',
    '📋 O assistente agora ORGANIZA os exercícios nas tuas fichas: cola o texto da ficha do teu personal (ou manda foto/PDF) e pede pra organizar nos treinos — ele preenche nome, foco, dia da semana e exercícios (semana A e B). Séries e cargas você registra treinando.'
  ]},
  { v:35, data:'2026-08-13', titulo:'Cargas sem beco sem saída', itens:[
    '🏋️ Tocou em "Cargas ›" num dia sem ficha ligada? Agora o app pergunta qual ficha é o treino daquele dia, liga com um toque e já abre pra anotar.'
  ]},
  { v:34, data:'2026-08-13', titulo:'Caminho das cargas', itens:[
    '🏋️ Os blocos de treino na Rotina ganharam o botão "Cargas ›" — vai direto pra ficha do dia, sem caçar.',
    '🧭 O card Treino do Hoje agora sempre mostra o próximo passo: "montar exercícios" quando a ficha está vazia, "registrar cargas" quando já tem.'
  ]},
  { v:33, data:'2026-08-13', titulo:'Ajustes à mão + treinos A/B', itens:[
    '⚙️ Os Ajustes ganharam aba própria na barra de baixo — chega de caçar a engrenagem no cantinho.',
    '🏋️ Treinos com semana A × semana B: pra quem alterna fichas (padrão × metabólico). Toca no ✎ do treino pra dar nome, foco e dia — e agora dá pra anotar o descanso de cada exercício.',
    '🤖 O assistente oferece botões de resposta rápida nas perguntas simples — menos digitação.',
    '🧹 Visual mais limpo: menos emoji repetido em títulos e listas, e ajustes finos pra iPhone (recortes de tela) e celulares menores.'
  ]},
  { v:32, data:'2026-08-13', titulo:'Check de treino + recomeço leve', itens:[
    '🏋️ Novo check "Treinei hoje" na aba Hoje: um toque e valeu — academia, corrida, futevôlei, vôlei, cardio, qualquer treino. Dá +10 XP de bônus (e descansar não desconta nada).',
    '🏆 Nova conquista "Treinos feitos": cada treino do seu histórico soma.',
    '🌱 Voltou depois de uns dias fora? O app te recebe com um recomeço leve — sem culpa: constância inclui recomeçar.',
    '💜 Linguagem mais nossa: "ofensiva" virou "constância", e o 🔥 zerado virou 🌱 (novo começo).'
  ]},
  { v:31, data:'2026-08-13', titulo:'Polimento geral', itens:[
    '☁️ Agora dá pra VER se teus dados estão na nuvem: a nuvenzinha no topo mostra o estado, avisa se faltar internet e tenta de novo sozinha.',
    '💪 Treino: registrou uma carga errada? Agora dá pra apagar o registro (no Histórico do exercício).',
    '🍽 Refeições: dá pra remover uma refeição do plano (toca no ✎ dela → Remover).',
    '😴 O sono confirma que salvou — e as horas dormidas aparecem na hora.',
    '📝 Textos, botões e alinhamentos padronizados no app inteiro — e excluir algo agora pede confirmação (chega de sustos).'
  ]},
  { v:30, data:'2026-08-13', titulo:'Central de novidades', itens:[
    '✨ O app agora te conta o que mudou: toda atualização importante aparece aqui no Hoje, e o histórico completo fica em ⚙️ Config → Novidades.'
  ]},
  { v:29, data:'2026-08-12', titulo:'Últimas melhorias', itens:[
    '📄 O assistente aceita PDF: manda a dieta do nutri ou a ficha de treino que ele organiza pra você.',
    '🖼 Foto de perfil: adiciona a sua em ⚙️ Config → Perfil & metas.',
    '📈 Nova aba Progresso: fotos, peso e conquistas num lugar só.',
    '🎨 Categorias da rotina do teu jeito: renomeia, troca as cores e cria novas em ⚙️ Config.',
    '👁 Campos de senha ganharam o "olhinho" — toca nele pra conferir o que digitou.',
    '🔑 Senha mais simples: não precisa mais de símbolo — mín. 8 caracteres, com maiúscula, minúscula e número.',
    '🚪 Criou a conta? Já entra direto, sem esperar e-mail de confirmação.'
  ]}
];
