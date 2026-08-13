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
function fmtBRL(v){ const n=Number(v); return (isFinite(n)?n:0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
function unidadeBets(){ const b=S.bets||{}; if(b.unidade&&UNIDADES[b.unidade]) return b.unidade; return b.ativo?'brl':'min'; }
function fmtQtd(v){ const n=Number(v); const x=isFinite(n)?n:0; return (Math.round(x*100)/100).toString().replace('.',','); }
function fmtUnidade(v,u){ u=u||unidadeBets(); if(u==='brl') return fmtBRL(v); if(u==='vez') return fmtQtd(v)+'x'; return fmtQtd(v)+' min'; }
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
  try{ localStorage.setItem(k,v); }
  catch(e){
    if(!_lsAvisou){ _lsAvisou=true;
      if(typeof toast==='function') toast('⚠️ Este navegador não está salvando os dados (aba privada?). Exporta um backup!');
    }
  }
}
function lsLimparConta(){ const k=storeKey(); delete _mem[k]; try{ localStorage.removeItem(k); }catch(e){} }

function migrarLocalUmaVez(){
  try{
    if(localStorage.getItem(MIGRADO_FLAG)) return null;
    const base=localStorage.getItem(STORE_KEY);
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
  // Semanas A/B: 4 fichas extras (e-h) pra quem alterna treinos (padrão × metabólico)
  if(S.treinos.semanaAtiva!=='B') S.treinos.semanaAtiva='A';
  ['e','f','g','h'].forEach((id,ix)=>{
    if(!S.treinos.split.find(t=>t&&t.id===id))
      S.treinos.split.push({id:id, dia:'', nome:'Treino '+'ABCD'[ix], foco:'', exercicios:[], semana:'B', diaSemana:null});
  });
  S.treinos.split.forEach(t=>{
    if(t.semana!=='B') t.semana=(['e','f','g','h'].includes(t.id)?'B':'A');
    if(!(Number.isInteger(t.diaSemana)&&t.diaSemana>=0&&t.diaSemana<=6)) t.diaSemana=null;
  });
  if(!S.gastos||typeof S.gastos!=='object') S.gastos=defaultState().gastos;
  if(!Array.isArray(S.gastos.categorias)) S.gastos.categorias=defaultState().gastos.categorias;
  if(!Array.isArray(S.gastos.lancamentos)) S.gastos.lancamentos=[];
  if(!S.estudo||!Array.isArray(S.estudo.cadernos)) S.estudo=defaultState().estudo;
  if(!Array.isArray(S.categorias)) S.categorias=defaultState().categorias;
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
  lsSet(JSON.stringify(S));

  if(!(opts&&opts.skipSync) && syncConfigurado()) setSyncEstado('pendente');
  if(!(opts&&opts.skipSync) && S.settings.syncAuto && syncConfigurado() && S.settings.ultimaSync){
    clearTimeout(_saveTimer);
    _saveTimer=setTimeout(()=>syncAgora().catch(falhaSync),1500);
  }
}

function diaVazio(){
  return { habitos:{}, refeicoes:{}, meds:{}, agua:0,
           sono:{h:null,score:null,deitou:'',acordou:''},
           humor:null, energia:null, nota:'',
           apostas:[], deslizes:{}, treino:false, treinoNota:'', xp:0 };
}
function getDia(iso){
  iso=iso||hojeISO();
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
  while(diaConta(d)){ s++; d=addDias(d,-1); }
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
    if(aplicavel(d)){ if(feito(d)) s++; else break; }
    d=addDias(d,-1);
  }
  return s;
}
function melhorStreak(){
  const datas=Object.keys(S.days).sort();
  if(!datas.length) return 0;
  let best=0,cur=0,prev=null;
  for(const iso of datas){
    if(!diaConta(iso)){ prev=iso; cur=0; continue; }
    if(prev && diffDias(prev,iso)===1 && cur>0) cur++;
    else cur=1;
    prev=iso; best=Math.max(best,cur);
  }
  return Math.max(best,streakGeral());
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
  recalcXP(hojeISO());
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
  if(syncConfigurado()){ try{ await syncPush(); }catch(e){ falhaSync(e); } }
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
function falhaSync(e){
  const semRede=(typeof navigator!=='undefined' && navigator.onLine===false);
  setSyncEstado(semRede?'offline':'erro');
  _syncTinhaErro=true;
  if(!_syncAvisou){
    _syncAvisou=true;
    const msg=traduzErroSync(e);
    if(msg && typeof toast==='function') toast('☁️ '+msg,{fixo:true});
  }
}
function sucessoSync(){
  setSyncEstado('ok');
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

function mesclarEstado(remoto){
  if(!remoto||typeof remoto!=='object'||Array.isArray(remoto)) return;
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

  if(outro.gastos&&Array.isArray(outro.gastos.lancamentos)){
    S.gastos.lancamentos=uniaoLanc(S.gastos.lancamentos,outro.gastos.lancamentos);
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
  S.settings=settingsLocais;
  Object.keys(S.days).forEach(recalcXPQuiet);
}
function recalcXPQuiet(iso){ try{ recalcXP(iso); }catch(e){} }

function canonico(x){
  if(Array.isArray(x)) return '['+x.map(canonico).join(',')+']';
  if(x&&typeof x==='object') return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonico(x[k])).join(',')+'}';
  return JSON.stringify(x);
}
function uniaoLanc(a,b){
  a=Array.isArray(a)?a:[]; b=Array.isArray(b)?b:[];
  const chave=x=>x&&x.id?('id:'+x.id):('c:'+canonico(x));
  const set=new Set(a.map(chave));
  const out=[...a];
  b.forEach(x=>{ const k=chave(x); if(!set.has(k)){ set.add(k); out.push(x);} });
  return out;
}
function mesclarDia(a,b){
  if(!a) return b; if(!b) return a;

  if(a._m&&b._m){
    const novo=a._m>=b._m?a:b, velho=a._m>=b._m?b:a;
    const out=JSON.parse(JSON.stringify(novo));
    out.apostas=uniaoLanc(novo.apostas,velho.apostas);
    if(!out.burnout&&velho.burnout) out.burnout=velho.burnout;
    return out;
  }

  const out=diaVazio();
  const ids=new Set([...Object.keys(a.habitos||{}),...Object.keys(b.habitos||{})]);
  ids.forEach(id=>{
    const va=(a.habitos||{})[id], vb=(b.habitos||{})[id];
    if(va===false||vb===false) out.habitos[id]=false;
    else if(va===true||vb===true) out.habitos[id]=true;
  });
  out.refeicoes=Object.assign({},a.refeicoes,b.refeicoes);
  out.meds=Object.assign({},a.meds,b.meds);
  out.agua=Math.max(a.agua||0,b.agua||0);
  out.sono=(b.sono&&(b.sono.h||b.sono.deitou))?b.sono:(a.sono||out.sono);
  out.humor=b.humor||a.humor; out.energia=b.energia||a.energia;
  out.nota=(b.nota&&b.nota.length>=(a.nota||'').length)?b.nota:(a.nota||'');
  out.apostas=uniaoLanc(a.apostas,b.apostas);
  out.deslizes=Object.assign({},a.deslizes,b.deslizes);
  out.treino=!!(a.treino||b.treino);
  out.treinoNota=b.treinoNota||a.treinoNota||'';
  out.burnout=b.burnout||a.burnout;
  out._m=(a._m||b._m)||undefined;
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
function treinoDeHoje(){
  const dow=new Date().getDay();
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
function addExercicio(idTreino,nome){
  const t=treinoPorId(idTreino); if(!t||!nome) return null;
  const ex={id:uid(),nome:nome,registros:[]};
  t.exercicios.push(ex); saveState(); return ex;
}
function removerExercicio(idTreino,idEx){
  const t=treinoPorId(idTreino); if(!t) return;
  t.exercicios=t.exercicios.filter(e=>e.id!==idEx); saveState();
}
function registrarCarga(idTreino,idEx,series,reps,carga,descanso){
  const t=treinoPorId(idTreino); if(!t) return;
  const ex=t.exercicios.find(e=>e.id===idEx); if(!ex) return;
  const reg={id:uid(),data:hojeISO(),series:Number(series)||0,reps:Number(reps)||0,carga:round2(Number(String(carga).replace(',','.'))||0)};
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

function catGasto(id){ return S.gastos.categorias.find(c=>c.id===id)||{nome:'?',icone:'📦',cor:'var(--c-livre)'}; }
function addGasto(valor,catId,descricao,dataISO){
  const v=round2(Number(String(valor).replace(',','.'))||0);
  if(v<=0) return;
  S.gastos.lancamentos.push({id:uid(),valor:v,cat:catId,desc:descricao||'',data:dataISO||hojeISO()});
  saveState();
}
function removerGasto(id){ S.gastos.lancamentos=S.gastos.lancamentos.filter(g=>g.id!==id); saveState(); }
function gastosDoDia(iso){ iso=iso||hojeISO(); return S.gastos.lancamentos.filter(g=>g.data===iso); }
function gastosDoMes(anoMes){
  anoMes=anoMes||hojeISO().slice(0,7);
  return S.gastos.lancamentos.filter(g=>g.data&&g.data.slice(0,7)===anoMes);
}
function totalLista(lista){ return lista.reduce((a,g)=>a+(g.valor||0),0); }
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
function removerCaderno(id){ S.estudo.cadernos=S.estudo.cadernos.filter(c=>c.id!==id); saveState(); }
function addNota(idCaderno,texto){
  const c=cadernoPorId(idCaderno); if(!c||!texto||!texto.trim()) return;
  c.notas.push({id:uid(),data:hojeISO(),ts:new Date().toISOString(),texto:texto.trim()});
  saveState();
}
function removerNota(idCaderno,idNota){
  const c=cadernoPorId(idCaderno); if(!c) return;
  c.notas=c.notas.filter(n=>n.id!==idNota); saveState();
}
