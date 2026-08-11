/* ============================================================
   CONSTANTE — núcleo: estado, storage, datas, XP, streak,
   finanças, apostas e sincronização (Supabase REST)
   ============================================================ */
'use strict';

/* ---------- datas ---------- */
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
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,7); }
function round2(v){ return Math.round(v*100)/100; }

/* ---------- storage (protegido p/ ambientes sem localStorage) ---------- */
const STORE_KEY='constante_v1';
let _mem=null,_lsAvisou=false;
function lsGet(){ try{ return localStorage.getItem(STORE_KEY); }catch(e){ return _mem; } }
function lsSet(v){
  _mem=v;
  try{ localStorage.setItem(STORE_KEY,v); }
  catch(e){
    if(!_lsAvisou){ _lsAvisou=true;
      if(typeof toast==='function') toast('⚠️ Este navegador não está salvando os dados (aba privada?). Exporta um backup!');
    }
  }
}

let S=null; // estado global

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
  // pesos: só entradas válidas e numéricas (dados vindos de import/nuvem entram no gráfico SVG)
  S.pesos=S.pesos.filter(p=>p&&typeof p.data==='string'&&isFinite(Number(p.kg)))
                 .map(p=>({data:p.data,kg:Number(p.kg)}));
  if(!S.pesos.length) S.pesos=[{data:hojeISO(),kg:Number(S.profile&&S.profile.peso)||72}];
  if(!Array.isArray(S.finance.dividas)) S.finance.dividas=[];
  if(!Array.isArray(S.finance.rendas)) S.finance.rendas=[];
  if(!Array.isArray(S.finance.extras)) S.finance.extras=[];
  if(!Array.isArray(S.diet.refeicoes)) S.diet.refeicoes=defaultState().diet.refeicoes;
  if(!Array.isArray(S.meds.grupos)) S.meds.grupos=defaultState().meds.grupos;
}
function loadState(){
  const raw=lsGet();
  if(raw){
    try{ S=deepFill(JSON.parse(raw),defaultState()); }
    catch(e){ S=defaultState(); }
  } else S=defaultState();
  sanearEstado();
  if(!S._ts) S._ts=new Date().toISOString();
  return S;
}

let _saveTimer=null;
function saveState(opts){
  S._ts=new Date().toISOString();
  const dHoje=S.days[hojeISO()];
  if(dHoje) dHoje._m=S._ts; // carimbo do dia p/ mesclagem entre aparelhos
  lsSet(JSON.stringify(S));
  // auto-push só depois da PRIMEIRA sync bem-sucedida (evita segundo aparelho
  // recém-configurado sobrescrever a nuvem com estado vazio)
  if(!(opts&&opts.skipSync) && S.settings.syncAuto && syncConfigurado() && S.settings.ultimaSync){
    clearTimeout(_saveTimer);
    _saveTimer=setTimeout(()=>syncPush().catch(()=>{}),1500);
  }
}

/* ---------- registro do dia ---------- */
function diaVazio(){
  return { habitos:{}, refeicoes:{}, meds:{}, agua:0,
           sono:{h:null,score:null,deitou:'',acordou:''},
           humor:null, energia:null, nota:'',
           apostas:[], deslizes:{}, treinoNota:'', xp:0 };
}
function getDia(iso){
  iso=iso||hojeISO();
  if(!S.days[iso]) S.days[iso]=diaVazio();
  return deepFill(S.days[iso],diaVazio());
}

/* ---------- hábitos aplicáveis ---------- */
function habitosDoDia(iso){
  const dow=isoToDate(iso||hojeISO()).getDay();
  return S.habits.filter(h=>h.dias.includes(dow));
}

/* ---------- XP ---------- */
function xpPossivel(iso){
  let t=0;
  habitosDoDia(iso).forEach(h=>t+=h.xp||10);
  t+=15;            // remédios (3 grupos × 5)
  t+=S.diet.refeicoes.length*5;
  t+=10+10+5;       // água + sono + humor
  return t;
}
function recalcXP(iso){
  const d=getDia(iso); let xp=0;
  habitosDoDia(iso).forEach(h=>{ if(d.habitos[h.id]) xp+=h.xp||10; });
  S.meds.grupos.forEach(g=>{ if(d.meds[g.id]) xp+=5; });
  S.diet.refeicoes.forEach(r=>{ if(d.refeicoes[r.id]) xp+=5; });
  if((d.agua||0)>=S.profile.aguaAlvoMl) xp+=10;
  if(d.sono && (d.sono.h||d.sono.deitou)) xp+=10;
  if(d.humor) xp+=5;
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

/* ---------- streaks ---------- */
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
  else if(aplicavel(d)&&!feito(d)){ /* hoje ainda em aberto — olha pra trás */ }
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

/* ---------- conquistas ---------- */
function checarConquistas(){
  const g=S.gamif; const novas=[];
  const tem=id=>g.conquistas.includes(id);
  const dar=id=>{ if(!tem(id)){ g.conquistas.push(id); novas.push(CONQUISTAS.find(c=>c.id===id)); } };
  const dias=Object.keys(S.days);
  if(dias.some(d=>diaConta(d))) dar('primeiro_dia');
  const st=streakGeral();
  if(st>=7||melhorStreak()>=7) dar('streak7');
  if(st>=30||melhorStreak()>=30) dar('streak30');
  if(dias.filter(d=>S.days[d].sono&&(S.days[d].sono.h||S.days[d].sono.deitou)).length>=7) dar('sono7');
  if(dias.filter(d=>(S.days[d].agua||0)>=S.profile.aguaAlvoMl).length>=7) dar('agua7');
  if(dias.filter(d=>S.days[d].habitos.treino).length>=16) dar('treino16');
  if(dias.filter(d=>S.days[d].habitos.leitura).length>=20) dar('leitor');
  if(dias.filter(d=>S.days[d].habitos.duo_en&&S.days[d].habitos.duo_it&&S.days[d].habitos.duo_es).length>=14) dar('poliglota');
  // semana sem apostas: 7 dias seguidos sem registro (e app em uso há pelo menos 7 dias)
  if(diffDias(S.criadoEm,hojeISO())>=6){
    let semAposta=0, dd=hojeISO();
    for(let i=0;i<7;i++){ const rec=S.days[dd]; if(rec&&rec.apostas&&rec.apostas.length){ semAposta=-1; break;} semAposta++; dd=addDias(dd,-1); }
    if(semAposta>=7) dar('semana_zero');
  }
  const fin=resumoFinanceiro();
  if(fin.quitadas>=1) dar('divida1');
  if(fin.pago>=fin.total/2 && fin.total>0) dar('metade_divida');
  if(fin.saldo<=0 && fin.total>0) dar('livre');
  return novas;
}

/* ---------- finanças ---------- */
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

/* ---------- apostas ---------- */
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
  // semanas já encerradas: limite - gasto (se positivo) e ainda não transferido
  const atual=semanaDoPlano();
  let econ=0;
  for(let w=0;w<atual;w++) econ+=Math.max(0, limiteSemana(w)-gastoNaSemana(w));
  const jaTransferido=S.finance.extras.filter(e=>e.origem==='apostas').reduce((a,e)=>a+e.valor,0);
  return Math.max(0, econ-jaTransferido);
}

/* ---------- sincronização (Supabase REST, sem SDK) ---------- */
function syncConfigurado(){
  const s=S.settings;
  return !!(s.syncUrl && s.syncKey && s.syncCode);
}
function _syncHeaders(){
  return { 'apikey':S.settings.syncKey, 'Authorization':'Bearer '+S.settings.syncKey,
           'Content-Type':'application/json' };
}
async function syncPush(opts){
  if(!syncConfigurado()) throw new Error('Sync não configurada');
  const url=S.settings.syncUrl.replace(/\/+$/,'')+'/rest/v1/constante_state';
  // privacidade: settings (chaves, código, config local) NUNCA sobem pra nuvem
  const payload={...S}; delete payload.settings;
  const body=JSON.stringify([{ sync_code:S.settings.syncCode, payload, updated_at:new Date().toISOString() }]);
  // keepalive: tenta concluir o envio mesmo se a aba for fechada/minimizada (limite ~64KB)
  const keepalive=!!(opts&&opts.flush)&&body.length<60000;
  const r=await fetch(url,{method:'POST',
    headers:{..._syncHeaders(),'Prefer':'resolution=merge-duplicates'},
    body, keepalive});
  if(!r.ok) throw new Error('Falha ao enviar ('+r.status+')');
  S.settings.ultimaSync=new Date().toISOString();
  lsSet(JSON.stringify(S));
  return true;
}
async function syncPull(){
  if(!syncConfigurado()) throw new Error('Sync não configurada');
  const url=S.settings.syncUrl.replace(/\/+$/,'')+'/rest/v1/constante_state'
    +'?sync_code=eq.'+encodeURIComponent(S.settings.syncCode)+'&select=payload,updated_at';
  const r=await fetch(url,{headers:_syncHeaders()});
  if(!r.ok) throw new Error('Falha ao baixar ('+r.status+')');
  const rows=await r.json();
  if(!rows.length){
    // nuvem vazia também conta como sync ok (primeiro upload liberado)
    S.settings.ultimaSync=new Date().toISOString();
    lsSet(JSON.stringify(S));
    return false;
  }
  mesclarEstado(rows[0].payload);
  S.settings.ultimaSync=new Date().toISOString();
  saveState({skipSync:true});
  return true;
}
async function syncAgora(){
  // pull PRECISA funcionar antes de qualquer push — nunca sobrescrever a nuvem às cegas
  await syncPull();
  await syncPush();
}
/* mescla: dias = escrita mais recente vence (carimbo _m) com apostas unidas;
   listas financeiras = união por id; settings = SEMPRE os locais (não trafegam) */
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
  const settingsLocais=JSON.parse(JSON.stringify(S.settings)); // nunca vêm da nuvem
  const financeOutro=(outro.finance&&typeof outro.finance==='object')?outro.finance:{};
  S=deepFill(JSON.parse(JSON.stringify(base)),defaultState());
  sanearEstado();
  S.days=dias;
  // dívidas: união por id (dívida criada só no outro aparelho não pode sumir)
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
  S.settings=settingsLocais;
  Object.keys(S.days).forEach(recalcXPQuiet);
}
function recalcXPQuiet(iso){ try{ recalcXP(iso); }catch(e){} }
/* união de lançamentos {id?,valor,data,...}: por id quando houver, senão por forma canônica
   (chaves ordenadas — jsonb do Postgres reordena chaves e quebraria o stringify puro) */
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
  // com carimbo _m nos dois: a escrita mais recente vence (permite DESMARCAR sem ressuscitar),
  // apostas sempre unidas por id pra não perder lançamento de nenhum aparelho
  if(a._m&&b._m){
    const novo=a._m>=b._m?a:b, velho=a._m>=b._m?b:a;
    const out=JSON.parse(JSON.stringify(novo));
    out.apostas=uniaoLanc(novo.apostas,velho.apostas);
    if(!out.burnout&&velho.burnout) out.burnout=velho.burnout;
    return out;
  }
  // legado (sem carimbo): mescla otimista campo a campo
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
  out.treinoNota=b.treinoNota||a.treinoNota||'';
  out.burnout=b.burnout||a.burnout;
  out._m=(a._m||b._m)||undefined;
  return out;
}

/* ---------- rotina helpers ---------- */
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
