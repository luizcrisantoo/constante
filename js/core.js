'use strict';

function pad2(n){ return String(n).padStart(2,'0'); }
function dateToISO(d){ return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate()); }
function hojeISO(){ return dateToISO(new Date()); }
function isoToDate(iso){ const [y,m,d]=iso.split('-').map(Number); return new Date(y,m-1,d); }
function addDias(iso,n){ const d=isoToDate(iso); d.setDate(d.getDate()+n); return dateToISO(d); }
function diffDias(a,b){ return Math.round((isoToDate(b)-isoToDate(a))/86400000); }
function fmtData(iso){ const d=isoToDate(iso); return pad2(d.getDate())+'/'+pad2(d.getMonth()+1); }
function fmtDataLonga(iso){ const d=isoToDate(iso); return DIAS_NOME[d.getDay()]+', '+pad2(d.getDate())+'/'+pad2(d.getMonth()+1)+'/'+d.getFullYear(); }
function agoraHM(){ const d=new Date(); return pad2(d.getHours())+':'+pad2(d.getMinutes()); }
function hmParaMin(hm){ if(!hm) return null; const [h,m]=hm.split(':').map(Number); return h*60+(m||0); }
// Dinheiro que pode ser escondido: o app inteiro escreve valor por aqui, e a aba
// Grana decide se mostra ou borra. Útil pra quem abre o app no ônibus, no trampo.
function granaOculta(){ return !!(S.settings&&S.settings.granaOculta); }
function $$(v){ return '<span class="dinheiro">'+fmtBRL(v)+'</span>'; }
function fmtBRL(v){ const n=Number(v); return (isFinite(n)?n:0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
function unidadeBets(){ const b=S.bets||{}; if(b.unidade&&UNIDADES[b.unidade]) return b.unidade; return b.ativo?'brl':'min'; }
function fmtQtd(v){ const n=Number(v); const x=isFinite(n)?n:0; return (Math.round(x*100)/100).toString().replace('.',','); }
function fmtUnidade(v,u){ u=u||unidadeBets(); if(u==='brl') return fmtBRL(v); if(u==='vez') return fmtQtd(v)+'x'; return fmtQtd(v)+' min'; }
// Lê número do jeito que gente escreve: "12,50", "R$ 12,50", "1.500", "1.500,75", "12.50".
// Antes só trocava vírgula por ponto, então "R$ 12,50" virava "valor inválido" e a pessoa
// desistia de registrar o gasto. Devolve NaN quando não há número nenhum.
function numeroBR(x){
  if(typeof x==='number') return isFinite(x)?x:NaN;
  let s=String(x==null?'':x).trim();
  s=s.replace(/[^\d.,-]/g,'');                 // fora R$, espaço, "reais", emoji…
  if(!s||!/\d/.test(s)) return NaN;
  const neg=s.charAt(0)==='-';
  s=s.replace(/-/g,'');
  const ult=Math.max(s.lastIndexOf(','), s.lastIndexOf('.'));
  let inteiro=s, decimal='';
  if(ult>=0){
    const casas=s.length-ult-1;
    const sep=s.charAt(ult);
    // ponto com exatamente 3 casas é separador de milhar no Brasil (1.500), não decimal
    const ehMilhar=(sep==='.'&&casas===3);
    if(!ehMilhar){ inteiro=s.slice(0,ult); decimal=s.slice(ult+1); }
  }
  const n=Number(inteiro.replace(/[.,]/g,'')+(decimal?('.'+decimal.replace(/[.,]/g,'')):''));
  if(!isFinite(n)) return NaN;
  return neg?-n:n;
}
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,7); }
function round2(v){ return Math.round(v*100)/100; }

const STORE_KEY='constante_v1';
const MIGRADO_FLAG='constante_migrado_local';
let _mem={}, _lsAvisou=false, _userKey=null;

function storeKey(){ return STORE_KEY + (_userKey ? ('_u_'+_userKey) : ''); }
function setUserKey(id){ _userKey=id||null; }
function lsGet(){ const k=storeKey(); try{ return localStorage.getItem(k); }catch(e){ return _mem[k]; } }
function lsSet(v){
  const k=storeKey(); _mem[k]=v;
  try{ localStorage.setItem(k,v); return; }catch(e){}
  // sem espaço: joga fora as cópias de segurança antes de desistir do dado principal
  try{ apagarCopias(); localStorage.setItem(k,v); return; }catch(e){}
  {
    if(!_lsAvisou){ _lsAvisou=true;
      if(typeof toast==='function') toast('⚠️ Este navegador não está salvando os dados (aba privada ou memória cheia?). Exporta um backup!');
    }
  }
}
function lsLimparConta(){
  if(!_userKey) return;   // sem conta ativa a chave é a base (dados de quem usa sem conta) — não apaga
  const k=storeKey(); delete _mem[k];
  try{ localStorage.removeItem(k); }catch(e){}
  apagarCopias();         // a cópia de segurança sai junto: senão fica dado pessoal no navegador
}

function migrarLocalUmaVez(){
  try{
    if(localStorage.getItem(MIGRADO_FLAG)) return null;
    const base=localStorage.getItem(STORE_KEY)||_mem[STORE_KEY]||null;
    localStorage.setItem(MIGRADO_FLAG,'1');
    return base||null;
  }catch(e){ return null; }
}

let S=null;

function categorias(){ return Array.isArray(S&&S.categorias)?S.categorias:[]; }
function catPorId(id){ return categorias().find(c=>c&&c.id===id)||null; }
function corCat(id){ const c=catPorId(id); return c?c.cor:'#565550'; }

function deepFill(alvo,base){
  if(Array.isArray(base)) return (alvo===undefined)?JSON.parse(JSON.stringify(base)):alvo;
  if(base && typeof base==='object'){
    if(!alvo || typeof alvo!=='object') alvo={};
    for(const k of Object.keys(base)) alvo[k]=deepFill(alvo[k],base[k]);
    return alvo;
  }
  return (alvo===undefined)?base:alvo;
}

function sanearEstado(){
  if(!S||typeof S!=='object'||Array.isArray(S)) S=defaultState();
  if(!S.days||typeof S.days!=='object'||Array.isArray(S.days)) S.days={};
  ['habits','routine','pesos'].forEach(k=>{ if(!Array.isArray(S[k])) S[k]=defaultState()[k]; });

  S.pesos=S.pesos.filter(p=>p&&typeof p.data==='string'&&isFinite(Number(p.kg)))
                 .map(p=>({data:p.data,kg:Number(p.kg)}));
  // não fabrica um peso inicial: quem é novo começa sem registro (a tela mostra vazio)
  if(!Array.isArray(S.finance.dividas)) S.finance.dividas=[];
  if(!Array.isArray(S.finance.rendas)) S.finance.rendas=[];
  if(!Array.isArray(S.finance.extras)) S.finance.extras=[];
  if(!Array.isArray(S.diet.refeicoes)) S.diet.refeicoes=defaultState().diet.refeicoes;
  if(!Array.isArray(S.meds.grupos)) S.meds.grupos=defaultState().meds.grupos;
  if(!S.treinos||!Array.isArray(S.treinos.split)) S.treinos=defaultState().treinos;
  S.treinos.split.forEach(t=>{ if(!Array.isArray(t.exercicios)) t.exercicios=[]; });
  // Fichas antigas podiam vir SEM id interno (aí toque/editar falhava em silêncio) — regenera:
  const idsPadraoT=['a','b','c','d','e','f','g','h'];
  S.treinos.split.forEach((t,ix)=>{
    if(!t||typeof t!=='object') return;
    if(!t.id){
      const cand=idsPadraoT[ix];
      t.id=(cand && !S.treinos.split.some(o=>o&&o!==t&&o.id===cand)) ? cand : 't'+uid();
    }
    t.exercicios.forEach(e=>{
      if(e&&!e.id) e.id='ex'+uid();
      if(e&&Array.isArray(e.registros)) e.registros.forEach(r=>{ if(r&&!r.id) r.id='rg'+uid(); });
    });
  });
  // Semanas A/B: 4 fichas extras (e-h) pra quem alterna treinos (padrão × metabólico)
  if(S.treinos.semanaAtiva!=='B') S.treinos.semanaAtiva='A';
  ['e','f','g','h'].forEach((id,ix)=>{
    if(!S.treinos.split.find(t=>t&&t.id===id))
      S.treinos.split.push({id:id, dia:'', nome:'Treino '+'ABCD'[ix], foco:'', exercicios:[], semana:'B', diaSemana:null});
  });
  S.treinos.split.forEach(t=>{
    if(t.semana!=='B') t.semana=(['e','f','g','h'].includes(t.id)?'B':'A');
    if(!(Number.isInteger(t.diaSemana)&&t.diaSemana>=0&&t.diaSemana<=6)) t.diaSemana=null;
    // adiamento é temporário: some sozinho quando o dia chega/passa
    if(!(typeof t.adiadoPara==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(t.adiadoPara)&&t.adiadoPara>hojeISO())) t.adiadoPara=null;
  });
  if(!S.gastos||typeof S.gastos!=='object') S.gastos=defaultState().gastos;
  if(!Array.isArray(S.gastos.categorias)) S.gastos.categorias=defaultState().gastos.categorias;
  if(!Array.isArray(S.gastos.lancamentos)) S.gastos.lancamentos=[];
  if(!Array.isArray(S.gastos.projetos)) S.gastos.projetos=[];
  if(!Array.isArray(S.gastos.receitas)) S.gastos.receitas=[];
  // backup importado / blob da nuvem não são confiáveis: corta tamanho na LEITURA
  S.gastos.projetos.forEach(p=>{
    if(!p||typeof p!=='object') return;
    p.nome=String(p.nome==null?'':p.nome).slice(0,40);
    p.icone=String(p.icone==null?'🎯':p.icone).slice(0,4);
  });
  S.gastos.projetos=S.gastos.projetos.filter(p=>p&&typeof p==='object'&&p.id);
  // Um lançamento pode citar um projeto que ainda não chegou da nuvem. NÃO se limpa
  // o campo aqui: quem lê é que ignora projeto desconhecido (projPorId devolve null).
  if(!S.estudo||!Array.isArray(S.estudo.cadernos)) S.estudo=defaultState().estudo;
  if(!Array.isArray(S.categorias)) S.categorias=defaultState().categorias;
  lixeira(); limparLixeiraVelha();
  if(typeof social==='function') social();
  onbEstado();
}
function loadState(){
  const raw=lsGet();
  if(raw){
    try{ S=deepFill(JSON.parse(raw),defaultState()); }
    catch(e){ S=defaultState(); }
  } else S=defaultState();
  sanearEstado();
  // Não carimba estado novo/vazio com a hora atual: senão um aparelho recém-aberto
  // (estado vazio) venceria a mesclagem e apagaria os dados vindos da nuvem. Sem _ts,
  // ele conta como o mais antigo e o dado real remoto entra como base.
  return S;
}

let _saveTimer=null;
function saveState(opts){
  S._ts=new Date().toISOString();
  const dHoje=S.days[hojeISO()];
  if(dHoje) dHoje._m=S._ts;
  const foco=diaFoco();
  if(foco!==hojeISO()&&S.days[foco]) S.days[foco]._m=S._ts;
  lsSet(JSON.stringify(S));

  if(!(opts&&opts.skipSync) && syncConfigurado()) setSyncEstado('pendente');
  if(!(opts&&opts.skipSync) && typeof publicarCartao==='function') publicarCartao();
  if(!(opts&&opts.skipSync) && S.settings.syncAuto && syncConfigurado() && S.settings.ultimaSync){
    clearTimeout(_saveTimer);
    _saveTimer=setTimeout(()=>syncAgora().catch(falhaSync),1500);
  }
}

function diaVazio(){
  return { habitos:{}, refeicoes:{}, meds:{}, agua:0,
           sono:{h:null,score:null,deitou:'',acordou:''},
           humor:null, energia:null, nota:'',
           apostas:[], deslizes:{}, treino:false, treinoNota:'', neutro:'', xp:0 };
}
// Dia que a tela Hoje está mostrando. Normalmente é hoje; a pessoa pode voltar
// até 2 dias pra consertar o que esqueceu de marcar (o mesmo espírito do gasto retroativo).
const DIAS_PRA_TRAS=2;
let _diaFoco=null;
function diaFoco(){
  if(!_diaFoco) return hojeISO();
  const dif=diffDias(_diaFoco,hojeISO());
  if(dif>=0&&dif<=DIAS_PRA_TRAS) return _diaFoco;
  // virou a meia-noite com a tela num dia antigo: solta o foco e redesenha
  _diaFoco=null;
  if(typeof render==='function') setTimeout(()=>{ try{ render(); }catch(e){} },0);
  return hojeISO();
}
function setDiaFoco(iso){ _diaFoco=(iso&&iso!==hojeISO())?iso:null; }
function ehHojeFoco(){ return diaFoco()===hojeISO(); }

// Dia neutro: viajei / doente / dia difícil. Não conta como vitória nem como falha.
function diaNeutro(iso){ const d=S.days[iso]; return !!(d&&d.neutro); }
const NEUTRO_LABEL={viagem:'🧳 Viagem',doente:'🤒 Doente',dificil:'🌧️ Dia difícil'};

function getDia(iso){
  iso=iso||diaFoco();
  if(!S.days[iso]) S.days[iso]=diaVazio();
  return deepFill(S.days[iso],diaVazio());
}

function habitosDoDia(iso){
  const dow=isoToDate(iso||hojeISO()).getDay();
  return S.habits.filter(h=>h.dias.includes(dow));
}

function xpPossivel(iso){
  let t=0;
  habitosDoDia(iso).forEach(h=>t+=h.xp||10);
  t+=15;
  t+=S.diet.refeicoes.length*5;
  t+=10+10+5;
  return t;
}
function recalcXP(iso){
  const d=getDia(iso); let xp=0;
  habitosDoDia(iso).forEach(h=>{ if(d.habitos[h.id]) xp+=h.xp||10; });
  S.meds.grupos.forEach(g=>{ if(d.meds[g.id]) xp+=5; });
  S.diet.refeicoes.forEach(r=>{ if(d.refeicoes[r.id]) xp+=5; });
  if(Number(S.profile.aguaAlvoMl)>0 && (d.agua||0)>=Number(S.profile.aguaAlvoMl)) xp+=10;
  if(d.sono && (d.sono.h||d.sono.deitou)) xp+=10;
  if(d.humor) xp+=5;
  if(d.treino) xp+=10; // treino é bônus: soma quando acontece; descansar não desconta
  d.xp=xp;
  return xp;
}
// Copia as marcações de ontem que ainda fazem sentido hoje (checklists, não medições).
// soContar=true faz só a contagem, sem escrever nada.
function repetirOntem(soContar){
  const iso=hojeISO(), ant=addDias(iso,-1);
  const o=S.days[ant]; if(!o) return 0;
  const d=getDia(iso); let n=0;
  habitosDoDia(iso).forEach(h=>{
    if(o.habitos&&o.habitos[h.id]===true&&d.habitos[h.id]!==true){ if(!soContar) d.habitos[h.id]=true; n++; }
  });
  S.diet.refeicoes.forEach(r=>{
    if(o.refeicoes&&o.refeicoes[r.id]&&!d.refeicoes[r.id]){ if(!soContar) d.refeicoes[r.id]=true; n++; }
  });
  S.meds.grupos.forEach(g=>{
    if(o.meds&&o.meds[g.id]&&!d.meds[g.id]){ if(!soContar) d.meds[g.id]=true; n++; }
  });
  if(!soContar&&n){ recalcXP(iso); saveState(); }
  return n;
}
// ---- Onboarding por intenção ----
function onbEstado(){
  if(!S.settings.onboard||typeof S.settings.onboard!=='object'||Array.isArray(S.settings.onboard))
    S.settings.onboard={feito:false,intencoes:[],vitoria:''};
  if(!Array.isArray(S.settings.onboard.intencoes)) S.settings.onboard.intencoes=[];
  return S.settings.onboard;
}
function temIntencao(id){ return onbEstado().intencoes.indexOf(id)>=0; }
// Só pra quem chega de verdade em branco: quem já tem dados nunca vê a abertura.
function precisaOnboarding(){
  const o=onbEstado();
  if(o.feito) return false;
  if(S.habits.length||S.routine.length) return false;
  if((S.profile.nome||'').trim()) return false;
  if(S.settings.ultimaVisita||S.settings.nomeAdiado) return false;
  // qualquer rastro de uso (dia com algo marcado, peso, gasto) já descarta a abertura.
  // Obs.: dia VAZIO não conta — o próprio render() cria o registro de hoje ao abrir o app.
  const usou=Object.keys(S.days||{}).some(k=>{
    const d=S.days[k]||{};
    return (d.xp||0)>0 || (d.nota||'').trim() || (Array.isArray(d.apostas)&&d.apostas.length) || d.treino;
  });
  if(usou) return false;
  if((S.pesos||[]).length||(S.gastos&&S.gastos.lancamentos||[]).length) return false;
  return true;
}
// ---- v53: água do jeito de cada um ----
// A pessoa bebe em copo, em garrafa, na garrafinha de 473ml — o app não tem que decidir isso.
// Guardar sempre em ML mantém meta, XP e conquistas funcionando sem migração nenhuma.
const AGUA_PADRAO=[
  {id:'copo',    icone:'🥤', nome:'Copo',    ml:250},
  {id:'garrafa', icone:'🍶', nome:'Garrafa', ml:500}
];
const AGUA_MAX_REC=4;   // mais que isso a fileira de botões deixa de caber no celular
function aguaRecipientes(){
  if(!S.profile) return AGUA_PADRAO.slice();
  let r=S.profile.aguaRecipientes;
  if(!Array.isArray(r)||!r.length) return AGUA_PADRAO.map(x=>Object.assign({},x));
  r=r.filter(x=>x&&typeof x==='object'&&Number(x.ml)>0)
     .map(x=>({ id:x.id||('ag'+uid()),
                icone:String(x.icone||'💧').slice(0,4),
                nome:String(x.nome||'Água').slice(0,20),
                ml:Math.min(5000,Math.max(10,Math.round(Number(x.ml)))) }))
     .slice(0,AGUA_MAX_REC);
  return r.length?r:AGUA_PADRAO.map(x=>Object.assign({},x));
}
function salvarRecipientes(lista){
  S.profile.aguaRecipientes=(Array.isArray(lista)?lista:[]).slice(0,AGUA_MAX_REC);
  saveState();
}
function aguaUnidade(){ return (S.profile&&S.profile.aguaUnidade==='ml')?'ml':'L'; }
// número sem sufixo, pra caber no destaque grande da tela
function aguaNum(ml){
  ml=Math.max(0,Math.round(Number(ml)||0));
  return (aguaUnidade()==='ml') ? fmtQtd(ml) : fmtQtd(Math.round(ml/10)/100);
}
function fmtAgua(ml){ return aguaNum(ml)+' '+aguaUnidade(); }

function addHabitoSimples(nome,icone,tipo){
  if(!nome) return null;
  if(S.habits.some(h=>(h.nome||'').toLowerCase()===nome.toLowerCase())) return null;
  const h={id:'hb'+uid(),nome:nome,icone:icone||'⭐',tipo:(tipo==='evitar'?'evitar':'fazer'),dias:[0,1,2,3,4,5,6],xp:10};
  S.habits.push(h); return h;
}
// Três sugestões pra quem chega em branco, tiradas da intenção que a pessoa escolheu.
// Só do tipo "fazer": a primeira vitória tem que ser algo que dá pra MARCAR hoje.
function sugestoesIniciais(){
  const its=onbEstado().intencoes||[];
  const out=[], visto={};
  const poe=s=>{
    if(!s||s.tipo==='evitar'||out.length>=3) return;
    const k=(s.nome||'').toLowerCase();
    if(visto[k]||S.habits.some(h=>(h.nome||'').toLowerCase()===k)) return;
    visto[k]=1; out.push(s);
  };
  its.forEach(id=>(SUGESTOES_HABITO[id]||[]).forEach(poe));
  // sem intenção nenhuma, um trio que serve pra qualquer pessoa
  [['agua',0],['treino',1],['cabeca',1]].forEach(([id,ix])=>poe((SUGESTOES_HABITO[id]||[])[ix]));
  return out;
}
// Prepara só o que a intenção pede — e nunca por cima do que a pessoa já tem.
function aplicarIntencoes(lista){
  (lista||[]).forEach(id=>{
    if(id==='agua'&&!Number(S.profile.aguaAlvoMl)){
      const kg=Number(S.profile.peso)||0;
      S.profile.aguaAlvoMl = kg>0 ? Math.round(kg*35/100)*100 : 2000;   // ~35 ml/kg
    }
    if(id==='comer'&&!S.diet.refeicoes.length){
      [['Café da manhã','07:30'],['Almoço','12:00'],['Janta','19:30']].forEach(r=>{
        S.diet.refeicoes.push({id:'ref'+uid(),nome:r[0],hora:r[1],kcal:0,prot:0,itens:[],subs:[]});
      });
    }
    if(id==='aposta') S.bets.ativo=true;
  });
}
function diaConta(iso){
  const d=S.days[iso]; if(!d) return false;
  return (d.xp||0) >= Math.min(80, Math.round(xpPossivel(iso)*0.5));
}
function xpTotal(){
  let t=0; for(const k of Object.keys(S.days)) t+=(S.days[k].xp||0);
  return t;
}
function nivelAtual(){
  const xp=xpTotal(); let n=NIVEIS[0];
  for(const lv of NIVEIS) if(xp>=lv.xp) n=lv;
  const idx=NIVEIS.indexOf(n);
  const prox=NIVEIS[idx+1]||null;
  return { ...n, xp, prox, pct: prox? Math.min(100,Math.round(100*(xp-n.xp)/(prox.xp-n.xp))) : 100 };
}

function streakGeral(){
  let s=0; let d=hojeISO();
  if(diaConta(d)) s++;
  d=addDias(d,-1);
  // dia neutro não soma (ninguém ganha linha marcando "foi difícil") mas também não quebra
  while(diaConta(d)||diaNeutro(d)){ if(diaConta(d)) s++; d=addDias(d,-1); }
  return s;
}
function streakHabito(id){
  let s=0; let d=hojeISO();
  const h=S.habits.find(x=>x.id===id); if(!h) return 0;
  const aplicavel=iso=>h.dias.includes(isoToDate(iso).getDay());
  const feito=iso=>S.days[iso]&&S.days[iso].habitos[id];
  if(aplicavel(d)&&feito(d)) s++;
  else if(aplicavel(d)&&!feito(d)){  }
  d=addDias(d,-1);
  let guard=0;
  while(guard++<3650){
    if(aplicavel(d)&&!diaNeutro(d)){ if(feito(d)) s++; else break; }
    d=addDias(d,-1);
  }
  return s;
}
function melhorStreak(){
  const datas=Object.keys(S.days).sort();
  if(!datas.length) return 0;
  let best=0,cur=0,prev=null;
  for(const iso of datas){
    if(!diaConta(iso)){
      if(diaNeutro(iso)){ prev=iso; continue; }   // pausa: mantém a contagem viva
      prev=iso; cur=0; continue;
    }
    if(prev && diffDias(prev,iso)===1 && cur>0) cur++;
    else cur=1;
    prev=iso; best=Math.max(best,cur);
  }
  return Math.max(best,streakGeral());
}

// Moldura do avatar = RECORDE pessoal (melhorStreak) — nunca rebaixa.
function molduraTier(){
  const r=melhorStreak();
  if(r>=365) return {id:'ametista', nome:'Ametista', icone:'🟣', min:365, prox:null};
  if(r>=100) return {id:'ouro', nome:'Ouro', icone:'🥇', min:100, prox:365};
  if(r>=30)  return {id:'prata', nome:'Prata', icone:'🥈', min:30, prox:100};
  if(r>=7)   return {id:'bronze', nome:'Bronze', icone:'🥉', min:7, prox:30};
  return {id:'semente', nome:'Semente', icone:'🌱', min:0, prox:7};
}

function saudacaoHora(){
  const h=new Date().getHours();
  return h<5?'Boa madrugada':h<12?'Bom dia':h<18?'Boa tarde':'Boa noite';
}

function marcosAte(valor, fixos, incr){
  const atingidos=fixos.filter(m=>m<=valor);
  let proximo=fixos.find(m=>m>valor);
  if(proximo===undefined){
    const base=fixos[fixos.length-1];
    let m=base+incr;
    while(m<=valor){ atingidos.push(m); m+=incr; }
    proximo=m;
  }
  return {atingidos, proximo};
}
const MARCOS_DIAS=[3,7,14,30,60,100,150,200,300,365,500,750,1000];
const MARCOS_XP=[100,500,1000,2500,5000,10000,25000,50000,100000];

function metricasConquista(){
  const dias=Object.keys(S.days);
  const contaDias=fn=>dias.filter(fn).length;
  const cats=[
    {chave:'ofensiva', titulo:'Dias de constância', icone:'🔥', unidade:'dias seguidos', valor:melhorStreak(), fixos:MARCOS_DIAS, incr:500},
    {chave:'xp', titulo:'XP acumulado', icone:'🌟', unidade:'XP', valor:xpTotal(), fixos:MARCOS_XP, incr:50000},
    {chave:'dias', titulo:'Dias completos', icone:'✅', unidade:'dias batidos', valor:contaDias(d=>diaConta(d)), fixos:MARCOS_DIAS, incr:500},
    {chave:'agua', titulo:'Hidratação', icone:'💧', unidade:'dias na meta de água', valor:contaDias(d=>Number(S.profile.aguaAlvoMl)>0 && (S.days[d].agua||0)>=Number(S.profile.aguaAlvoMl)), fixos:MARCOS_DIAS, incr:500},
    {chave:'sono', titulo:'Sono registrado', icone:'😴', unidade:'noites', valor:contaDias(d=>S.days[d].sono&&(S.days[d].sono.h||S.days[d].sono.deitou)), fixos:MARCOS_DIAS, incr:500},
    {chave:'treino', titulo:'Treinos feitos', icone:'🏋️', unidade:'treinos', valor:contaDias(d=>S.days[d].treino===true), fixos:MARCOS_DIAS, incr:500}
  ];

  S.habits.filter(h=>h.tipo==='fazer').forEach(h=>{
    const feito=contaDias(d=>S.days[d].habitos&&S.days[d].habitos[h.id]===true);
    cats.push({chave:'hab_'+h.id, titulo:h.nome, icone:h.icone||'⭐', unidade:'vezes', valor:feito, fixos:MARCOS_DIAS, incr:500});
  });
  return cats;
}

function gerarConquistas(){
  const out=[];
  metricasConquista().forEach(c=>{
    const {atingidos,proximo}=marcosAte(c.valor,c.fixos,c.incr);
    atingidos.forEach(m=>out.push({
      id:c.chave+'_'+m, icone:c.icone, nome:c.titulo+' — '+m,
      desc:m+' '+c.unidade, ganha:true, cat:c.chave, meta:m
    }));
    out.push({
      id:c.chave+'_'+proximo, icone:c.icone, nome:c.titulo+' — '+proximo,
      desc:((proximo-c.valor)===1?'Falta 1':'Faltam '+(proximo-c.valor))+' pra '+proximo+' '+c.unidade, ganha:false, cat:c.chave,
      meta:proximo, valor:c.valor, proxima:true
    });
  });
  return out;
}

function checarConquistas(){
  const g=S.gamif; if(!Array.isArray(g.conquistas)) g.conquistas=[];
  const jaTem=new Set(g.conquistas);
  const novas=[];
  gerarConquistas().filter(c=>c.ganha).forEach(c=>{
    if(!jaTem.has(c.id)){ g.conquistas.push(c.id); jaTem.add(c.id); novas.push(c); }
  });
  return novas;
}

function saldoDivida(dv){ return Math.max(0, dv.total - dv.pagos.reduce((a,p)=>a+p.valor,0)); }
function resumoFinanceiro(){
  const dividas=S.finance.dividas;
  const total=dividas.reduce((a,d)=>a+d.total,0);
  const saldo=dividas.reduce((a,d)=>a+saldoDivida(d),0);
  const pago=total-saldo;
  const quitadas=dividas.filter(d=>saldoDivida(d)<=0.005).length;
  const renda=S.finance.rendas.reduce((a,r)=>a+r.valor,0);
  return { total,saldo,pago,quitadas,renda };
}
function projecaoDividas(){
  const aporte=S.finance.aporteMensal;
  let saldos=S.finance.dividas.map(d=>({nome:d.nome,saldo:saldoDivida(d)}));
  const meses=[]; if(aporte<=0) return {meses,fim:null};
  const d0=new Date(); let m=d0.getMonth(), y=d0.getFullYear();
  const NOME_MES=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  let guard=0;
  while(saldos.some(s=>s.saldo>0.005) && guard++<120){
    let disp=aporte; const pagamentos=[];
    for(const s of saldos){
      if(s.saldo<=0.005||disp<=0) continue;
      const v=Math.min(s.saldo,disp);
      s.saldo-=v; disp-=v;
      pagamentos.push({nome:s.nome,valor:v,quitou:s.saldo<=0.005});
    }
    meses.push({label:NOME_MES[m]+'/'+String(y).slice(2),pagamentos,resta:saldos.reduce((a,s)=>a+s.saldo,0)});
    m++; if(m>11){m=0;y++;}
  }
  const incompleta=saldos.some(s=>s.saldo>0.005);
  return {meses,fim:(!incompleta&&meses.length)?meses[meses.length-1].label:null,incompleta};
}

function semanaDoPlano(iso){
  const inicio=S.bets.inicioPlano;
  return Math.max(0, Math.floor(diffDias(inicio, iso||hojeISO())/7));
}
function limiteSemana(idx){
  const b=S.bets;
  if(idx>=b.semanasParaZero) return 0;
  return Math.max(0, Math.round(b.limiteSemanaInicial*(1-idx/b.semanasParaZero)));
}
function gastoNaSemana(idx){
  const ini=addDias(S.bets.inicioPlano, idx*7);
  let g=0;
  for(let i=0;i<7;i++){
    const rec=S.days[addDias(ini,i)];
    if(rec&&rec.apostas) g+=rec.apostas.reduce((a,x)=>a+x.valor,0);
  }
  return g;
}
function registrarAposta(valor){
  const d=getDia();
  d.apostas.push({id:uid(), valor:valor, hora:agoraHM()});
  d.habitos.apostas=false;
  recalcXP(diaFoco());
  saveState();
}
function economiaDisponivel(){

  const atual=semanaDoPlano();
  let econ=0;
  for(let w=0;w<atual;w++) econ+=Math.max(0, limiteSemana(w)-gastoNaSemana(w));
  const jaTransferido=S.finance.extras.filter(e=>e.origem==='apostas').reduce((a,e)=>a+e.valor,0);
  return Math.max(0, econ-jaTransferido);
}

function produtoAtivo(){ return typeof modoProduto==='function' && modoProduto(); }
function syncConfigurado(){
  if(produtoAtivo()) return !!(typeof tokenAcesso==='function' && tokenAcesso());
  const s=S.settings;
  return !!(s.syncUrl && s.syncKey && s.syncCode);
}
function _syncBase(){
  return (produtoAtivo()?CONSTANTE_CONFIG.supabaseUrl:S.settings.syncUrl).replace(/\/+$/,'');
}
function _syncHeaders(){
  if(produtoAtivo()){
    return { 'apikey':CONSTANTE_CONFIG.supabaseKey, 'Authorization':'Bearer '+tokenAcesso(),
             'Content-Type':'application/json' };
  }
  return { 'apikey':S.settings.syncKey, 'Authorization':'Bearer '+S.settings.syncKey,
           'Content-Type':'application/json' };
}
async function syncPush(opts){
  if(!syncConfigurado()) throw new Error(produtoAtivo()?'Entra na tua conta primeiro':'Sync não configurada');
  setSyncEstado('sincronizando');
  const payload={...S}; delete payload.settings;
  let url, linha;
  if(produtoAtivo()){
    url=_syncBase()+'/rest/v1/constante_accounts';
    linha={ user_id:usuarioAtual().id, payload, updated_at:new Date().toISOString() };
  } else {
    url=_syncBase()+'/rest/v1/constante_state';
    linha={ sync_code:S.settings.syncCode, payload, updated_at:new Date().toISOString() };
  }
  const body=JSON.stringify([linha]);

  const keepalive=!!(opts&&opts.flush)&&body.length<60000;
  const r=await fetch(url,{method:'POST',
    headers:{..._syncHeaders(),'Prefer':'resolution=merge-duplicates'},
    body, keepalive});
  if(r.status===401||r.status===403){ sessaoExpirou(); throw new Error('Sessão expirada'); }
  if(!r.ok) throw new Error('Falha ao enviar ('+r.status+')');
  S.settings.ultimaSync=new Date().toISOString();
  lsSet(JSON.stringify(S));
  sucessoSync();
  return true;
}
async function syncPull(){
  if(!syncConfigurado()) throw new Error(produtoAtivo()?'Entra na tua conta primeiro':'Sync não configurada');
  setSyncEstado('sincronizando');
  const url=produtoAtivo()
    ? _syncBase()+'/rest/v1/constante_accounts?user_id=eq.'+encodeURIComponent(usuarioAtual().id)+'&select=payload,updated_at'
    : _syncBase()+'/rest/v1/constante_state?sync_code=eq.'+encodeURIComponent(S.settings.syncCode)+'&select=payload,updated_at';
  const r=await fetch(url,{headers:_syncHeaders()});
  if(r.status===401||r.status===403){ sessaoExpirou(); throw new Error('Sessão expirada'); }
  if(!r.ok) throw new Error('Falha ao baixar ('+r.status+')');
  const rows=await r.json();
  if(!rows.length){

    S.settings.ultimaSync=new Date().toISOString();
    lsSet(JSON.stringify(S));
    sucessoSync();
    return false;
  }
  mesclarEstado(rows[0].payload);
  S.settings.ultimaSync=new Date().toISOString();
  saveState({skipSync:true});
  sucessoSync();
  return true;
}
async function syncAgora(){

  await syncPull();
  await syncPush();
}

async function flushSyncPendente(){
  clearTimeout(_saveTimer);
  if(!syncConfigurado()) return true;
  try{ await syncPush(); return true; }
  catch(e){ falhaSync(e); return false; }
}

// ---------- Estado VISÍVEL da sincronização (P0 da auditoria) ----------
// 'local' = sem conta/sync (não mostra nada) · 'ok' = salvo na nuvem ·
// 'pendente' = mudança ainda não enviada · 'sincronizando' · 'offline' · 'erro'
let _syncEstado='local';
let _syncAvisou=false;     // já avisou desta sequência de falhas? (anti-spam)
let _syncTinhaErro=false;  // pra comemorar quando voltar a funcionar
function syncEstado(){ return _syncEstado; }
function setSyncEstado(s){
  if(_syncEstado===s) return;
  _syncEstado=s;
  if(typeof renderTopbar==='function' && !document.body.classList.contains('modo-login')){
    try{ renderTopbar(); }catch(e){}
  }
}
function traduzErroSync(e){
  const m=(e&&e.message)||'';
  if(/Failed to fetch|NetworkError|Load failed/i.test(m)) return 'Sem internet agora — teus registros estão salvos no aparelho e sobem sozinhos quando a conexão voltar.';
  if(/Sessão expirada/i.test(m)) return '';
  if(/\(5\d\d\)|\(4\d\d\)/.test(m)) return 'O servidor teve um soluço — teus dados continuam no aparelho, vou tentar de novo sozinho.';
  return 'A sincronização falhou ('+m+') — teus dados continuam salvos no aparelho.';
}
// Reenvio teimoso: enquanto tiver mudança sem subir, tenta de novo sozinho —
// 20s, 40s, 1min20, … até 10min. Some quando dá certo.
let _reenvioT=null, _reenvioN=0;
function cancelarReenvio(){ if(_reenvioT){ clearTimeout(_reenvioT); _reenvioT=null; } _reenvioN=0; }
function agendarReenvio(){
  if(_reenvioT||!syncConfigurado()) return;
  const espera=Math.min(600000,20000*Math.pow(2,Math.min(_reenvioN,5)));
  _reenvioT=setTimeout(()=>{
    _reenvioT=null; _reenvioN++;
    if(!syncConfigurado()) return;
    if(typeof navigator!=='undefined'&&navigator.onLine===false){ agendarReenvio(); return; }
    syncAgora().catch(err=>falhaSync(err));
  },espera);
}
function temPendencia(){
  if(_syncEstado!=='ok') return true;                       // inclui 'sincronizando' travado
  return (S._ts||'')>(S.settings&&S.settings.ultimaSync||'');
}

function falhaSync(e){
  const semRede=(typeof navigator!=='undefined' && navigator.onLine===false);
  setSyncEstado(semRede?'offline':'erro');
  _syncTinhaErro=true;
  agendarReenvio();
  if(!_syncAvisou){
    _syncAvisou=true;
    const msg=traduzErroSync(e);
    if(msg && typeof toast==='function') toast('☁️ '+msg,{fixo:true});
  }
}
function sucessoSync(){
  setSyncEstado('ok');
  cancelarReenvio();
  _syncAvisou=false;
  if(_syncTinhaErro){
    _syncTinhaErro=false;
    if(typeof toast==='function') toast('☁️ Sincronizado de novo ✓');
  }
}

let _tratandoSessao=false;
function sessaoExpirou(){
  if(!produtoAtivo()||_tratandoSessao) return;
  _tratandoSessao=true;
  if(typeof authSair==='function') Promise.resolve(authSair()).catch(()=>{});
  if(typeof toast==='function') toast('Tua sessão expirou — entra de novo.');
  setTimeout(()=>{ _tratandoSessao=false; },3000);
}

// Rede de segurança: antes de deixar a nuvem mexer no estado, guarda o que tinha
// no aparelho. Se a mesclagem fizer algo estranho, dá pra voltar em Ajustes.
const COPIA_SLOTS=2;
const COPIA_MAX=700000;          // por cópia; acima disso não guarda (espaço do navegador)
const COPIA_INTERVALO=15*60000;  // no máximo uma cópia a cada 15 min
function chaveCopia(i){ return storeKey()+'_bkp'+(i||0); }
function lerCopia(i){
  try{ const b=localStorage.getItem(chaveCopia(i)); return b?JSON.parse(b):null; }catch(e){ return null; }
}
function copiasSeguranca(){
  const out=[];
  for(let i=0;i<COPIA_SLOTS;i++){ const c=lerCopia(i); if(c&&c.dados) out.push({slot:i,em:c.em,tam:c.dados.length}); }
  return out;
}
function copiaSeguranca(){ return copiasSeguranca()[0]||null; }
function apagarCopias(){
  try{ for(let i=0;i<COPIA_SLOTS;i++) localStorage.removeItem(chaveCopia(i)); }catch(e){}
}
function guardarCopiaSeguranca(){
  try{
    const raw=lsGet();
    if(!raw) return;
    if(raw.length>COPIA_MAX){ apagarCopias(); return; }   // não deixa cópia velha ocupando espaço
    const atual=lerCopia(0);
    if(atual){
      // uma cópia a cada 15 min: senão os pulls de 1 em 1 minuto apagam o histórico útil
      if(Date.now()-Date.parse(atual.em)<COPIA_INTERVALO) return;
      // nunca troca uma cópia rica por uma pobre (estado encolheu = provável perda)
      if(raw.length<0.6*atual.dados.length) return;
      try{ localStorage.setItem(chaveCopia(1),JSON.stringify(atual)); }catch(e){}
    }
    localStorage.setItem(chaveCopia(0),JSON.stringify({em:new Date().toISOString(),dados:raw}));
  }catch(e){ apagarCopias(); }
}
function restaurarCopiaSeguranca(slot){
  const b=lerCopia(slot||0); if(!b||!b.dados) return false;
  try{
    S=deepFill(JSON.parse(b.dados),defaultState());
    sanearEstado();
    // restaurar é decisão da pessoa: vence a próxima mesclagem, inclusive dia a dia
    S._ts=new Date().toISOString();
    Object.keys(S.days).forEach(k=>{ if(S.days[k]) S.days[k]._m=S._ts; });
    saveState();
    return true;
  }catch(e){ return false; }
}

function mesclarEstado(remoto){
  if(!remoto||typeof remoto!=='object'||Array.isArray(remoto)) return;
  guardarCopiaSeguranca();
  const localMaisNovo = (S._ts||'') >= (remoto._ts||'');
  const diasLocal=S.days||{}, diasRemoto=(remoto.days&&typeof remoto.days==='object')?remoto.days:{};
  const dias={};
  const todas=new Set([...Object.keys(diasLocal),...Object.keys(diasRemoto)]);
  for(const iso of todas){
    dias[iso]=mesclarDia(diasLocal[iso],diasRemoto[iso]);
  }
  const base = localMaisNovo ? S : remoto;
  const outro = localMaisNovo ? remoto : S;
  const settingsLocais=JSON.parse(JSON.stringify(S.settings));
  const financeOutro=(outro.finance&&typeof outro.finance==='object')?outro.finance:{};
  S=deepFill(JSON.parse(JSON.stringify(base)),defaultState());
  sanearEstado();
  // junta as lápides dos dois aparelhos ANTES das uniões: sem isso, o que um apagou
  // volta pela lista do outro
  const lixoOutro=(outro&&outro.lixeira&&typeof outro.lixeira==='object')?outro.lixeira:{};
  const L=lixeira();
  Object.keys(lixoOutro).forEach(k=>{ if(!L[k]||L[k]<lixoOutro[k]) L[k]=lixoOutro[k]; });
  limparLixeiraVelha();
  S.days=dias;

  (Array.isArray(financeOutro.dividas)?financeOutro.dividas:[]).forEach(od=>{
    const jaTem=S.finance.dividas.find(x=>x.id===od.id);
    if(!jaTem) S.finance.dividas.push(JSON.parse(JSON.stringify(od)));
    else jaTem.pagos=uniaoLanc(jaTem.pagos,od.pagos);
  });
  S.finance.extras=uniaoLanc(S.finance.extras,financeOutro.extras||[]);
  if(Array.isArray(outro.pesos)){
    const porData={};
    [...S.pesos,...outro.pesos].forEach(p=>{ if(p&&p.data) porData[p.data]=p; });
    S.pesos=Object.values(porData).sort((a,b)=>a.data<b.data?-1:1);
  }
  if(outro.gamif) S.gamif.conquistas=[...new Set([...(S.gamif.conquistas||[]),...(outro.gamif.conquistas||[])])];

  // projetos ANTES dos lançamentos: assim nenhum lançamento que chega da nuvem
  // aponta pra um projeto que ainda não existe deste lado
  if(outro.gastos&&Array.isArray(outro.gastos.projetos)){
    S.gastos.projetos=uniaoLanc(S.gastos.projetos,outro.gastos.projetos);
  }
  if(outro.gastos&&Array.isArray(outro.gastos.lancamentos)){
    S.gastos.lancamentos=uniaoLanc(S.gastos.lancamentos,outro.gastos.lancamentos);
  }
  // sem isto, a entrada lançada no celular sumia ao abrir no note
  if(outro.gastos&&Array.isArray(outro.gastos.receitas)){
    S.gastos.receitas=uniaoLanc(S.gastos.receitas,outro.gastos.receitas);
  }
  if(outro.treinos&&Array.isArray(outro.treinos.split)){
    outro.treinos.split.forEach(ot=>{
      const t=S.treinos.split.find(x=>x.id===ot.id); if(!t) return;
      (ot.exercicios||[]).forEach(oe=>{
        const ex=t.exercicios.find(x=>x.id===oe.id);
        if(!ex) t.exercicios.push(JSON.parse(JSON.stringify(oe)));
        else ex.registros=uniaoLanc(ex.registros,oe.registros);
      });
    });
  }
  if(outro.estudo&&Array.isArray(outro.estudo.cadernos)){
    outro.estudo.cadernos.forEach(oc=>{
      const c=S.estudo.cadernos.find(x=>x.id===oc.id);
      if(!c) S.estudo.cadernos.push(JSON.parse(JSON.stringify(oc)));
      else c.notas=uniaoLanc(c.notas,oc.notas);
    });
  }
  // Seções de configuração em lista: união por id, pra somar o que foi criado em
  // aparelhos diferentes em vez de um sobrescrever o outro (hábitos, rotina,
  // lembretes, fotos de progresso, refeições e remédios).
  ['habits','routine','lembretes','progresso'].forEach(k=>{
    if(Array.isArray(outro[k])) S[k]=uniaoLanc(S[k],outro[k]);
  });
  if(outro.diet&&Array.isArray(outro.diet.refeicoes)) S.diet.refeicoes=uniaoLanc(S.diet.refeicoes,outro.diet.refeicoes);
  if(outro.meds&&Array.isArray(outro.meds.grupos)) S.meds.grupos=uniaoLanc(S.meds.grupos,outro.meds.grupos);
  // faltavam estas: quem criasse uma renda no celular e outra no note perdia uma delas
  if(outro.finance&&Array.isArray(outro.finance.rendas)) S.finance.rendas=uniaoLanc(S.finance.rendas,outro.finance.rendas);
  if(outro.gastos&&Array.isArray(outro.gastos.categorias)) S.gastos.categorias=uniaoLanc(S.gastos.categorias,outro.gastos.categorias);
  if(Array.isArray(outro.categorias)) S.categorias=uniaoLanc(S.categorias,outro.categorias);
  S.settings=settingsLocais;
  Object.keys(S.days).forEach(recalcXPQuiet);
}
function recalcXPQuiet(iso){ try{ recalcXP(iso); }catch(e){} }

function canonico(x){
  if(Array.isArray(x)) return '['+x.map(canonico).join(',')+']';
  if(x&&typeof x==='object') return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonico(x[k])).join(',')+'}';
  return JSON.stringify(x);
}
// ---------- Lixeira (lápides) ----------
// Sem isso, a união por id RESSUSCITA tudo que a pessoa apaga: o pull traz o item
// de volta da nuvem e o push seguinte torna a volta permanente. A lápide diz
// "isso foi apagado em tal hora" e a união respeita.
function chaveItem(x){ return (x&&x.id)?('id:'+x.id):('c:'+canonico(x)); }
function lixeira(){ if(!S.lixeira||typeof S.lixeira!=='object'||Array.isArray(S.lixeira)) S.lixeira={}; return S.lixeira; }
function apagarItem(x){
  const k=(typeof x==='string')?('id:'+x):chaveItem(x);
  lixeira()[k]=new Date().toISOString();
}
function estaNaLixeira(k){ return !!lixeira()[k]; }
function limparLixeiraVelha(){
  const lim=addDias(hojeISO(),-120);
  const L=lixeira();
  Object.keys(L).forEach(k=>{ if(String(L[k]).slice(0,10)<lim) delete L[k]; });
}
function uniaoLanc(a,b){
  a=Array.isArray(a)?a:[]; b=Array.isArray(b)?b:[];
  const L=lixeira();
  const chave=chaveItem;
  const vivo=x=>!L[chave(x)];
  const set=new Set(a.filter(vivo).map(chave));
  const out=a.filter(vivo);
  b.forEach(x=>{ const k=chave(x); if(!set.has(k)&&!L[k]){ set.add(k); out.push(x);} });
  return out;
}
function mesclarDia(a,b){
  if(!a) return b; if(!b) return a;

  // Mesmo com os dois carimbados, o dia é mesclado CAMPO A CAMPO. Antes, o carimbo
  // mais novo descartava o dia inteiro do outro aparelho — e só abrir o app já
  // carimbava o dia de hoje, então bastava abrir no note pra apagar o dia do celular.
  const aNovo=(a._m||'')>=(b._m||'');
  const novo=aNovo?a:b, velho=aNovo?b:a;

  const out=diaVazio();
  const ids=new Set([...Object.keys(a.habitos||{}),...Object.keys(b.habitos||{})]);
  ids.forEach(id=>{
    const va=(a.habitos||{})[id], vb=(b.habitos||{})[id];
    if(va===false||vb===false) out.habitos[id]=false;
    else if(va===true||vb===true) out.habitos[id]=true;
  });
  out.refeicoes=Object.assign({},velho.refeicoes,novo.refeicoes);
  out.meds=Object.assign({},velho.meds,novo.meds);
  out.agua=Math.max(a.agua||0,b.agua||0);
  const temSono=x=>x&&x.sono&&(x.sono.h||x.sono.deitou||x.sono.acordou||x.sono.score);
  out.sono=temSono(novo)?novo.sono:(temSono(velho)?velho.sono:out.sono);
  out.humor=novo.humor||velho.humor; out.energia=novo.energia||velho.energia;
  out.nota=(novo.nota&&novo.nota.trim())?novo.nota:(velho.nota||'');
  out.apostas=uniaoLanc(a.apostas,b.apostas);
  out.deslizes=Object.assign({},velho.deslizes,novo.deslizes);
  out.treino=!!(a.treino||b.treino);
  out.treinoNota=novo.treinoNota||velho.treinoNota||'';
  out.neutro=novo.neutro||velho.neutro||'';
  out.burnout=novo.burnout||velho.burnout;
  out._m=(a._m&&b._m)?(a._m>=b._m?a._m:b._m):((a._m||b._m)||undefined);
  return out;
}

function blocosDoDia(dow){
  return S.routine.filter(b=>b.d===dow).slice().sort((x,y)=>hmParaMin(x.i)-hmParaMin(y.i));
}
function blocoAtual(){
  const dow=new Date().getDay(); const agora=hmParaMin(agoraHM());
  const blocos=blocosDoDia(dow);
  let atual=null, prox=null;
  for(const b of blocos){
    const ini=hmParaMin(b.i), fim=b.f?hmParaMin(b.f):ini+10;
    if(agora>=ini&&agora<fim) atual=b;
    if(ini>agora&&!prox) prox=b;
  }
  return {atual,prox};
}

function treinosNaSemana(){
  let n=0;
  for(let i=0;i<7;i++){ const rec=S.days[addDias(hojeISO(),-i)]; if(rec&&rec.treino) n++; }
  return n;
}

function treinoPorId(id){ return S.treinos.split.find(t=>t.id===id)||null; }
// Resumo do treino em texto — pra mandar pro personal, pro amigo ou imprimir.
function textoTreino(t){
  if(!t) return '';
  const quando=(t.diaSemana!=null)?DIAS_NOME[t.diaSemana]:(t.dia||'');
  let s='🏋️ '+t.nome+(t.foco?' — '+t.foco:'')+'\n';
  s+=(quando?quando+' · ':'')+'Semana '+(t.semana||'A')+'\n\n';
  if(!t.exercicios.length) s+='(sem exercícios cadastrados)\n';
  t.exercicios.forEach((e,i)=>{
    const regs=(e.registros||[]).slice().sort((a,b)=>a.data<b.data?-1:1);
    const u=regs[regs.length-1];
    s+=(i+1)+'. '+e.nome;
    if(u) s+='  — última: '+u.series+'×'+u.reps+' · '+String(u.carga).replace('.',',')+' kg ('+fmtData(u.data)+')';
    s+='\n';
  });
  s+='\nfeito no Constante 🟣';
  return s;
}
function treinoDoDia(dow){
  const ativa=(S.treinos.semanaAtiva==='B')?'B':'A';
  const doDia=S.treinos.split.find(t=>t.semana===ativa && t.diaSemana===dow);
  if(doDia) return doDia;
  // compatibilidade: ninguém definiu dias ainda → usa o mapa antigo (Seg A, Qua B, Qui C, Sáb D)
  if(ativa==='A' && !S.treinos.split.some(t=>t.semana===ativa && t.diaSemana!=null)){
    const mapa={1:'a',3:'b',4:'c',6:'d'};
    return mapa[dow]?treinoPorId(mapa[dow]):null;
  }
  return null;
}
function treinoDoDiaISO(iso){
  iso=iso||hojeISO();
  // 1) alguém empurrou uma ficha PRA hoje? ela manda.
  const vindo=S.treinos.split.find(t=>t&&t.adiadoPara===iso);
  if(vindo) return vindo;
  const t=treinoDoDia(isoToDate(iso).getDay());
  // 2) a ficha natural de hoje foi empurrada pra frente → hoje fica livre.
  if(t&&t.adiadoPara&&t.adiadoPara>iso) return null;
  return t;
}
function treinoDeHoje(){ return treinoDoDiaISO(hojeISO()); }
// Ficha que era de hoje mas foi empurrada pra frente (pra avisar na tela).
function treinoAdiadoDeHoje(){
  const iso=hojeISO();
  const t=treinoDoDia(isoToDate(iso).getDay());
  return (t&&t.adiadoPara&&t.adiadoPara>iso)?t:null;
}
// Primeiro dia dos próximos 6 que não tem treino marcado — evita empilhar dois no mesmo dia.
function proximoDiaLivreTreino(id){
  const hoje=hojeISO();
  for(let i=1;i<=6;i++){
    const iso=addDias(hoje,i);
    const vindo=S.treinos.split.find(t=>t&&t.id!==id&&t.adiadoPara===iso);
    const nat=treinoDoDia(isoToDate(iso).getDay());
    const natVale=nat&&nat.id!==id&&!(nat.adiadoPara&&nat.adiadoPara>iso);
    if(!vindo&&!natVale) return iso;
  }
  return addDias(hoje,1);
}
function adiarTreino(id){
  const t=treinoPorId(id); if(!t) return null;
  t.adiadoPara=proximoDiaLivreTreino(id);
  saveState(); return t.adiadoPara;
}
function desfazerAdiamento(id){
  const t=treinoPorId(id); if(!t) return;
  t.adiadoPara=null; saveState();
}
function addExercicio(idTreino,nome){
  const t=treinoPorId(idTreino); if(!t||!nome) return null;
  const ex={id:uid(),nome:nome,registros:[]};
  t.exercicios.push(ex); saveState(); return ex;
}
function removerExercicio(idTreino,idEx){
  const t=treinoPorId(idTreino); if(!t) return;
  apagarItem(idEx);
  t.exercicios=t.exercicios.filter(e=>e.id!==idEx); saveState();
}
function registrarCarga(idTreino,idEx,series,reps,carga,descanso){
  const t=treinoPorId(idTreino); if(!t) return;
  const ex=t.exercicios.find(e=>e.id===idEx); if(!ex) return;
  const reg={id:uid(),data:hojeISO(),series:Number(series)||0,reps:Number(reps)||0,carga:round2(numeroBR(carga)||0)};
  const dsc=String(descanso||'').trim(); if(dsc) reg.descanso=dsc.slice(0,20);
  ex.registros.push(reg);
  saveState();
}
function ultimoRegistro(ex){
  if(!ex.registros||!ex.registros.length) return null;
  return ex.registros.slice().sort((a,b)=>a.data<b.data?1:-1)[0];
}
function evolucaoCarga(ex){

  const porData={};
  (ex.registros||[]).forEach(r=>{ porData[r.data]=Math.max(porData[r.data]||0, r.carga); });
  return Object.keys(porData).sort().map(d=>({data:d, carga:porData[d]}));
}

// ---------- v56: receitas (o que entra) ----------
// Ficam num array PRÓPRIO, não misturadas em lancamentos. Se entrassem lá, todo
// cálculo que já existe (total do mês, calendário, categorias, projetos) passaria a
// somar entrada com saída — e um esquecimento em qualquer um deles vira número errado
// na cara da pessoa.
function receitas(){
  if(!S.gastos) S.gastos=defaultState().gastos;
  if(!Array.isArray(S.gastos.receitas)) S.gastos.receitas=[];
  return S.gastos.receitas;
}
function fonteReceita(id){
  return (typeof FONTES_RECEITA!=='undefined' ? FONTES_RECEITA.find(f=>f.id===id) : null)
      || {id:'outros', icone:'📥', nome:'Entrada'};
}
function addReceita(valor,fonteId,descricao,dataISO){
  const v=round2(numeroBR(valor)||0);
  if(!isFinite(v)||v<=0) return null;
  const r={id:uid(), valor:v, fonte:fonteId||'outros', desc:descricao||'', data:dataISO||hojeISO()};
  receitas().push(r); saveState();
  return r;
}
function removerReceita(id){
  apagarItem(id);
  S.gastos.receitas=receitas().filter(r=>r&&r.id!==id);
  saveState();
}
function receitasDoMes(anoMes){
  anoMes=anoMes||hojeISO().slice(0,7);
  return receitas().filter(r=>r&&r.data&&r.data.slice(0,7)===anoMes);
}
function usaReceitas(){ return receitas().length>0; }
// Retrato do mês: entrou, saiu, e a diferença. Sem meta, sem elogio, sem bronca.
function saldoDoMes(anoMes){
  const ent=totalLista(receitasDoMes(anoMes));
  const sai=totalLista(gastosDoMes(anoMes));
  return { entrou:ent, saiu:sai, sobra:round2(ent-sai) };
}

function catGasto(id){ return S.gastos.categorias.find(c=>c.id===id)||{nome:'?',icone:'📦',cor:'var(--c-livre)'}; }
function addGasto(valor,catId,descricao,dataISO,projId){
  const v=round2(numeroBR(valor)||0);
  if(v<=0) return;
  const g={id:uid(),valor:v,cat:catId,desc:descricao||'',data:dataISO||hojeISO()};
  // campo some quando não é usado: nada de "proj:''" sujando o backup de quem não usa
  if(projId&&projPorId(projId)) g.proj=projId;
  S.gastos.lancamentos.push(g);
  saveState();
}
function removerGasto(id){ apagarItem(id); S.gastos.lancamentos=S.gastos.lancamentos.filter(g=>g.id!==id); saveState(); }
function gastosDoDia(iso){ iso=iso||hojeISO(); return S.gastos.lancamentos.filter(g=>g.data===iso); }
function gastosDoMes(anoMes){
  anoMes=anoMes||hojeISO().slice(0,7);
  return S.gastos.lancamentos.filter(g=>g.data&&g.data.slice(0,7)===anoMes);
}
function totalLista(lista){ return lista.reduce((a,g)=>a+(g.valor||0),0); }
// Valor curto pra caber na casinha do calendário: 35 / 1,2k
function fmtBRLCurto(v){
  const n=Math.round(Number(v)||0);
  if(n>=1000) return String(Math.round(n/100)/10).replace('.',',')+'k';
  return String(n);
}
function mesDeslocado(anoMes,n){
  const y=Number(anoMes.slice(0,4)), m=Number(anoMes.slice(5,7))-1+(n||0);
  const d=new Date(y,m,1);
  return d.getFullYear()+'-'+pad2(d.getMonth()+1);
}
function fmtMes(anoMes){
  const m=Number(anoMes.slice(5,7))-1;
  return (MESES_NOME[m]||'?')+'/'+anoMes.slice(0,4);
}
function gastosPorCategoria(lista){
  const m={};
  lista.forEach(g=>{ m[g.cat]=(m[g.cat]||0)+g.valor; });
  return S.gastos.categorias
    .map(c=>({cat:c, total:m[c.id]||0}))
    .filter(x=>x.total>0)
    .sort((a,b)=>b.total-a.total);
}
function addCategoriaGasto(nome,icone){
  if(!nome) return;
  S.gastos.categorias.push({id:uid(),nome:nome,icone:icone||'📦',cor:'var(--c-livre)'});
  saveState();
}

// ---------- v51: projetos financeiros (gasto por objetivo) ----------
// Categoria responde "com o QUE gastei"; projeto responde "pra QUAL objetivo".
// Quem não cria nenhum projeto não vê nada disso — nem um campo a mais no lançamento.
function projetos(){
  if(!S.gastos) S.gastos=defaultState().gastos;
  if(!Array.isArray(S.gastos.projetos)) S.gastos.projetos=[];
  // backup importado / blob da nuvem não são confiáveis: corta tamanho na LEITURA
  S.gastos.projetos.forEach(p=>{
    if(!p||typeof p!=='object') return;
    p.nome=String(p.nome==null?'':p.nome).slice(0,40);
    p.icone=String(p.icone==null?'🎯':p.icone).slice(0,4);
  });
  S.gastos.projetos=S.gastos.projetos.filter(p=>p&&typeof p==='object'&&p.id);
  return S.gastos.projetos;
}
function projetosAtivos(){ return projetos().filter(p=>p&&!p.arquivado); }
function projPorId(id){ return id?(projetos().find(p=>p&&p.id===id)||null):null; }
function addProjeto(nome,icone,alvo){
  nome=String(nome||'').trim().slice(0,40);
  if(!nome) return null;
  const p={ id:'pj'+uid(), nome:nome, icone:String(icone||'🎯').slice(0,4),
            alvo:(Number(alvo)>0?round2(Number(alvo)):null), inicio:hojeISO(), arquivado:false };
  projetos().push(p); saveState();
  return p;
}
function removerProjeto(id){
  apagarItem(id);
  // o gasto continua existindo: some só o vínculo com o objetivo
  S.gastos.lancamentos.forEach(g=>{ if(g&&g.proj===id) delete g.proj; });
  S.gastos.projetos=projetos().filter(p=>p&&p.id!==id);
  saveState();
}
function gastosDoProjeto(id){ return S.gastos.lancamentos.filter(g=>g&&g.proj===id); }
function totalProjeto(id){ return totalLista(gastosDoProjeto(id)); }
// gastos que ainda não têm objetivo — pra etiquetar o que já foi lançado antes
function gastosSemProjeto(desdeISO){
  const lim=desdeISO||addDias(hojeISO(),-75);
  return S.gastos.lancamentos.filter(g=>g&&g.data>=lim&&(!g.proj||!projPorId(g.proj)))
    .sort((a,b)=>a.data<b.data?1:(a.data>b.data?-1:0));
}
function marcarProjetoEmGastos(ids,projId){
  if(!projPorId(projId)) return 0;
  let n=0;
  (ids||[]).forEach(id=>{ const g=S.gastos.lancamentos.find(x=>x&&x.id===id); if(g){ g.proj=projId; n++; } });
  if(n) saveState();
  return n;
}

// ---------- v51: semana (pra revisão de domingo) ----------
// Semana de segunda a domingo — no domingo ela fecha inteira.
function inicioSemana(iso){
  iso=iso||hojeISO();
  const dow=isoToDate(iso).getDay();        // 0=Dom … 6=Sáb
  return addDias(iso, dow===0 ? -6 : (1-dow));
}
function diasDaSemana(iso){
  const ini=inicioSemana(iso);
  const out=[]; const hoje=hojeISO();
  for(let i=0;i<7;i++){ const d=addDias(ini,i); if(d<=hoje) out.push(d); }
  return out;
}
function semanaFechada(iso){ return isoToDate(iso||hojeISO()).getDay()===0; }

// Retrato da semana. Sem nota, sem ranking: só o que aconteceu.
function resumoSemana(iso){
  const dias=diasDaSemana(iso);
  const ini=inicioSemana(iso), fim=addDias(ini,6);
  const contaram=dias.filter(diaConta).length;
  const neutros=dias.filter(diaNeutro).length;
  const xp=dias.reduce((a,d)=>a+((S.days[d]&&S.days[d].xp)||0),0);
  const treinos=dias.filter(d=>S.days[d]&&S.days[d].treino).length;

  const habitos=S.habits.map(h=>{
    const previstos=dias.filter(d=>h.dias.includes(isoToDate(d).getDay()));
    const feitos=previstos.filter(d=>S.days[d]&&S.days[d].habitos&&S.days[d].habitos[h.id]===true);
    return { h:h, previstos:previstos.length, feitos:feitos.length,
             pct: previstos.length?Math.round(100*feitos.length/previstos.length):null };
  }).filter(x=>x.previstos>0);

  const sonos=dias.map(d=>S.days[d]&&S.days[d].sono&&Number(S.days[d].sono.h)).filter(h=>isFinite(h)&&h>0);
  const sonoMedia=sonos.length?Math.round(10*sonos.reduce((a,b)=>a+b,0)/sonos.length)/10:null;

  const lancs=S.gastos.lancamentos.filter(g=>g.data>=ini&&g.data<=fim);
  const porCat=gastosPorCategoria(lancs);

  return { ini, fim, dias, contaram, neutros, xp, treinos, habitos,
           sonoMedia, sonoDias:sonos.length,
           gasto:totalLista(lancs), lancs:lancs.length, topCat:porCat[0]||null,
           fechada:semanaFechada(iso), streak:streakGeral() };
}

// ---------- v51: barra de baixo personalizável ----------
function abaPorId(id){ return (typeof ABAS!=='undefined')?(ABAS.find(a=>a.id===id)||null):null; }
// Quanto cada aba já foi usada de verdade. Serve pra quem já tinha o app antes da
// v51: ninguém pode perder da barra justamente a aba que usa todo dia.
function usoDaAba(id){
  try{
    if(id==='rotina')    return (S.routine||[]).length;
    if(id==='dieta')     return (S.diet&&S.diet.refeicoes?S.diet.refeicoes.length:0)
                              + Object.keys(S.days||{}).filter(k=>S.days[k]&&S.days[k].refeicoes&&Object.keys(S.days[k].refeicoes).length).length;
    if(id==='grana')     return (S.gastos&&S.gastos.lancamentos?S.gastos.lancamentos.length:0)
                              + (S.finance&&S.finance.dividas?S.finance.dividas.length*5:0);
    if(id==='mente')     return (S.estudo&&S.estudo.cadernos?S.estudo.cadernos.length*3:0)
                              + Object.keys(S.days||{}).filter(k=>S.days[k]&&(S.days[k].humor||(S.days[k].nota||'').trim())).length
                              + ((S.bets&&S.bets.ativo)?10:0);
    if(id==='progresso') return (S.progresso||[]).length*3
                              + ((S.social&&S.social.amigos?S.social.amigos.length:0)*5);
    if(id==='config')    return (S.lembretes||[]).length;
  }catch(e){}
  return 0;
}
// Sem escolha salva: primeiro a intenção do primeiro uso, depois o que a pessoa
// mais usa, e o padrão só completa o que sobrou.
function barraSugerida(){
  const its=(typeof onbEstado==='function')?(onbEstado().intencoes||[]):[];
  const out=['hoje'];
  const poe=t=>{ if(t&&t!=='hoje'&&out.indexOf(t)<0&&out.length<BARRA_MAX) out.push(t); };
  its.forEach(i=>poe(BARRA_POR_INTENCAO[i]));
  (typeof ABAS!=='undefined'?ABAS:[]).filter(a=>!a.fixa)
    .map(a=>({id:a.id, uso:usoDaAba(a.id)}))
    .filter(x=>x.uso>0)
    .sort((a,b)=>b.uso-a.uso)
    .forEach(x=>poe(x.id));
  BARRA_PADRAO.forEach(poe);
  return out;
}
function barraAtual(){
  const salva=(S.settings&&Array.isArray(S.settings.barra)&&S.settings.barra.length)?S.settings.barra:null;
  let ids=(salva||barraSugerida()).filter(id=>!!abaPorId(id));
  ids=ids.filter((id,i)=>ids.indexOf(id)===i);     // sem repetido
  ids=ids.filter(id=>id!=='hoje');
  ids.unshift('hoje');                             // Hoje é sempre a primeira
  return ids.slice(0,BARRA_MAX);
}
function abasForaDaBarra(){
  const naBarra=barraAtual();
  return (typeof ABAS!=='undefined'?ABAS:[]).filter(a=>naBarra.indexOf(a.id)<0);
}
function salvarBarra(ids){
  ids=(Array.isArray(ids)?ids:[]).filter(id=>!!abaPorId(id)&&id!=='hoje');
  ids=ids.filter((id,i)=>ids.indexOf(id)===i).slice(0,BARRA_MAX-1);
  S.settings.barra=['hoje'].concat(ids);
  saveState();
}

// ---------- v51: avisos (lembretes gerados da rotina) ----------
function cfgAvisos(){
  if(!S.settings.avisos||typeof S.settings.avisos!=='object') S.settings.avisos=defaultState().settings.avisos;
  const a=S.settings.avisos;
  if(!/^\d{1,2}:\d{2}$/.test(a.silencioDe||'')) a.silencioDe='22:30';
  if(!/^\d{1,2}:\d{2}$/.test(a.silencioAte||'')) a.silencioAte='06:00';
  if(![0,10,30].includes(Number(a.antecedencia))) a.antecedencia=0;
  if(a.volta!==false) a.volta=true;   // quem nunca escolheu recebe (dá pra desligar num toque)
  return a;
}
// Silêncio pode atravessar a meia-noite (22:30 → 07:00).
function noSilencio(hm){
  const a=cfgAvisos();
  const m=hmParaMin(hm), de=hmParaMin(a.silencioDe), ate=hmParaMin(a.silencioAte);
  if(m==null||de==null||ate==null) return false;
  return (de<=ate) ? (m>=de&&m<ate) : (m>=de||m<ate);
}
function hmMenos(hm,min){
  let m=hmParaMin(hm); if(m==null) return hm;
  m=(m-(min||0)+1440)%1440;
  return pad2(Math.floor(m/60))+':'+pad2(m%60);
}
// Um aviso por (horário + título), com os dias em que aquele bloco existe.
function avisosDaRotina(){
  const a=cfgAvisos();
  const mapa={};
  (S.routine||[]).forEach(b=>{
    if(!b||!b.i||!b.t) return;
    if(!Number.isInteger(b.d)||b.d<0||b.d>6) return;   // bloco torto não vira aviso torto
    const hora=hmMenos(b.i,a.antecedencia);
    const k=hora+'|'+b.t;
    if(!mapa[k]) mapa[k]={hora:hora, titulo:b.t, tipo:b.tipo, dias:[], origem:b.i};
    if(mapa[k].dias.indexOf(b.d)<0) mapa[k].dias.push(b.d);
  });
  return Object.keys(mapa).map(k=>mapa[k])
    .map(x=>{ x.dias.sort(); x.calado=noSilencio(x.hora); return x; })
    .sort((x,y)=>x.hora.localeCompare(y.hora));
}
function textoAviso(x){
  const a=cfgAvisos();
  const t=String(x.titulo||'').slice(0,90);
  return a.antecedencia>0 ? ('⏰ '+t+' em '+a.antecedencia+' min') : ('⏰ '+t+' começa agora');
}
function jaTemLembrete(hora,texto){
  return (S.lembretes||[]).some(l=>l&&l.hora===hora&&l.texto===texto);
}
// Regera os avisos da rotina: refaz os que o app criou (deRotina) e pula o silêncio.
// Aviso que a pessoa editou na mão perde o selo deRotina e nunca é mexido aqui —
// senão mudar a antecedência encheria a lista de duplicados.
function criarAvisosDaRotina(){
  if(!Array.isArray(S.lembretes)) S.lembretes=[];
  const props=avisosDaRotina();
  const antigos=S.lembretes.filter(l=>l&&l.deRotina===true);

  // monta a lista NOVA antes de tocar na antiga: nunca se apaga o que existe
  // pra ficar com nada no lugar
  const novos=[]; let calados=0, repetidos=0;
  props.forEach(x=>{
    if(x.calado){ calados++; return; }
    const texto=textoAviso(x);
    const meu=S.lembretes.some(l=>l&&l.deRotina!==true&&l.hora===x.hora&&l.texto===texto);
    if(meu){ repetidos++; return; }              // já existe um teu, igualzinho: respeita
    // aviso gerado que a pessoa tinha pausado continua pausado depois de refeito
    const igual=antigos.find(l=>l.texto===texto);
    novos.push({ id:'lb'+uid(), hora:x.hora, texto:texto,
                 dias:(x.dias.length===7?[]:x.dias.slice()),
                 ativo:(igual&&igual.ativo===false)?false:true, deRotina:true });
  });
  if(!novos.length&&antigos.length){
    return {criados:0, calados, repetidos, refeitos:0, mantidos:antigos.length, total:props.length};
  }
  antigos.forEach(l=>apagarItem(l.id));
  S.lembretes=S.lembretes.filter(l=>!(l&&l.deRotina===true)).concat(novos);
  saveState();
  return {criados:novos.length, calados, repetidos, refeitos:antigos.length, mantidos:0, total:props.length};
}
function lembretesPausados(){
  const ls=S.lembretes||[];
  return ls.length>0 && ls.every(l=>l&&l.ativo===false);
}
// Pausar tudo é reversível de verdade: religar devolve só o que ESTE botão desligou,
// nunca o que a pessoa tinha pausado de propósito.
function pausarTodosLembretes(pausar){
  (S.lembretes||[]).forEach(l=>{
    if(!l) return;
    if(pausar){
      if(l.ativo===false){ l._eraPausado=true; return; }
      l.ativo=false;
    } else {
      if(l._eraPausado){ delete l._eraPausado; return; }
      l.ativo=true;
    }
  });
  saveState();
}

// ---------- Novidades (changelog pro usuário) ----------
const NOVIDADES_KEY='constante_novidades_v';
function versaoApp(){ return (typeof NOVIDADES!=='undefined'&&NOVIDADES.length)?NOVIDADES[0].v:1; }
function novidadesVistas(){ try{ return Number(localStorage.getItem(NOVIDADES_KEY))||0; }catch(e){ return versaoApp(); } }
function marcarNovidadesVistas(){ try{ localStorage.setItem(NOVIDADES_KEY,String(versaoApp())); }catch(e){} }
function novidadesNaoVistas(){
  if(typeof NOVIDADES==='undefined') return [];
  const vistas=novidadesVistas();
  if(vistas>=versaoApp()) return [];
  // Estreante (ainda sem hábitos/rotina/refeições): tudo é novo — não faz
  // sentido mostrar "o que mudou"; marca como visto em silêncio e segue.
  const novato=!((S&&S.habits||[]).length || (S&&S.routine||[]).length || (S&&S.diet&&S.diet.refeicoes||[]).length);
  if(!vistas && novato){ marcarNovidadesVistas(); return []; }
  return NOVIDADES.filter(n=>n.v>vistas);
}

function cadernoPorId(id){ return S.estudo.cadernos.find(c=>c.id===id)||null; }
function addCaderno(nome){
  if(!nome) return null;
  const c={id:uid(),nome:nome,notas:[]};
  S.estudo.cadernos.push(c); saveState(); return c;
}
function removerCaderno(id){ apagarItem(id); S.estudo.cadernos=S.estudo.cadernos.filter(c=>c.id!==id); saveState(); }
function addNota(idCaderno,texto){
  const c=cadernoPorId(idCaderno); if(!c||!texto||!texto.trim()) return;
  c.notas.push({id:uid(),data:hojeISO(),ts:new Date().toISOString(),texto:texto.trim()});
  saveState();
}
function removerNota(idCaderno,idNota){
  const c=cadernoPorId(idCaderno); if(!c) return;
  apagarItem(idNota);
  c.notas=c.notas.filter(n=>n.id!==idNota); saveState();
}
