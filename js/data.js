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
      nome:'', peso:null, altura:null, nascimento:'',
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
