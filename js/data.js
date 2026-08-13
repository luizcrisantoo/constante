'use strict';
const DIAS_NOME = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
const DIAS_ABREV = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
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
      syncUrl:'', syncKey:'', syncCode:'', syncAuto:true, ultimaSync:null
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
