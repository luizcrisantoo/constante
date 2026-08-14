'use strict';

// ---------- Fase 4: adicionar alguém e compartilhar hábitos ----------
// Regras que valem aqui:
// • ninguém te acha por busca — só entra quem recebeu o teu código
// • o amigo vê teu nome, tua constância e tua moldura; hábito só se VOCÊ marcar
// • nunca sobe peso, dinheiro, humor, remédios, apostas ou anotação — nem por engano
// • qualquer um dos dois desfaz sozinho

const AMIGOS_MAX = 20;
let _amigosCarregando = false;
let _cartaoUltimoEnvio = 0;

function social(){
  if(!S.social || typeof S.social!=='object' || Array.isArray(S.social))
    S.social = { codigo:'', compartilhados:[], amigos:[], visto:null };
  if(!Array.isArray(S.social.compartilhados)) S.social.compartilhados=[];
  if(!Array.isArray(S.social.amigos)) S.social.amigos=[];
  return S.social;
}
function socialDisponivel(){
  return typeof produtoAtivo==='function' && produtoAtivo()
      && typeof tokenAcesso==='function' && !!tokenAcesso();
}
function meuCodigo(){
  const s=social();
  if(!s.codigo){
    // sem 0/O/1/I pra não confundir na hora de ditar por voz
    const abc='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let c=''; for(let i=0;i<8;i++) c+=abc[Math.floor(Math.random()*abc.length)];
    s.codigo=c;
  }
  return s.codigo;
}
function habitoCompartilhado(id){ return social().compartilhados.indexOf(id)>=0; }
function alternarCompartilhado(id){
  const s=social(), i=s.compartilhados.indexOf(id);
  if(i>=0) s.compartilhados.splice(i,1); else s.compartilhados.push(id);
  saveState();
  publicarCartao(true);
}

// ---- o que vai pro servidor (e nada além disso) ----
function montarCartao(){
  const hoje=hojeISO(), d=S.days[hoje]||{};
  const habs=social().compartilhados.map(id=>{
    const h=S.habits.find(x=>x.id===id); if(!h) return null;
    return { id:h.id, nome:String(h.nome||'').slice(0,40), icone:h.icone||'⭐',
             hoje: (d.habitos&&d.habitos[h.id])===true,
             streak: (typeof streakHabito==='function')?streakHabito(h.id):0 };
  }).filter(Boolean);
  const t=(typeof molduraTier==='function')?molduraTier():{id:'semente'};
  return {
    user_id: usuarioAtual()?usuarioAtual().id:null,
    codigo: meuCodigo(),
    nome: String(S.profile.nome||'').trim().split(/\s+/)[0].slice(0,20),
    streak: (typeof streakGeral==='function')?streakGeral():0,
    melhor: (typeof melhorStreak==='function')?melhorStreak():0,
    moldura: t.id,
    habitos: habs,
    atualizado: new Date().toISOString()
  };
}

async function publicarCartao(forcar){
  if(!socialDisponivel()) return false;
  const agora=Date.now();
  if(!forcar && agora-_cartaoUltimoEnvio < 5*60000) return false;   // no máx. 1 envio a cada 5 min
  const cartao=montarCartao();
  if(!cartao.user_id) return false;
  try{
    const r=await fetch(_syncBase()+'/rest/v1/constante_perfil_publico',{
      method:'POST',
      headers:{..._syncHeaders(),'Prefer':'resolution=merge-duplicates'},
      body:JSON.stringify([cartao])
    });
    if(!r.ok) return false;
    _cartaoUltimoEnvio=agora;
    return true;
  }catch(e){ return false; }
}

async function carregarAmigos(){
  if(!socialDisponivel()||_amigosCarregando) return social().amigos;
  _amigosCarregando=true;
  try{
    const eu=usuarioAtual().id;
    const rl=await fetch(_syncBase()+'/rest/v1/constante_amizades?select=a,b',{headers:_syncHeaders()});
    if(!rl.ok) throw new Error('falha');
    const pares=await rl.json();
    const ids=pares.map(p=>p.a===eu?p.b:p.a).filter(Boolean);
    if(!ids.length){ social().amigos=[]; saveState({skipSync:true}); return []; }
    const lista='('+ids.map(encodeURIComponent).join(',')+')';
    const rc=await fetch(_syncBase()+'/rest/v1/constante_perfil_publico?select=user_id,nome,streak,melhor,moldura,habitos,atualizado&user_id=in.'+lista,{headers:_syncHeaders()});
    if(!rc.ok) throw new Error('falha');
    const cartoes=await rc.json();
    social().amigos=cartoes.map(c=>({
      id:c.user_id, nome:c.nome||'—', streak:c.streak||0, melhor:c.melhor||0,
      moldura:c.moldura||'semente', habitos:Array.isArray(c.habitos)?c.habitos:[],
      atualizado:c.atualizado||null
    })).sort((x,y)=>y.streak-x.streak);
    social().visto=new Date().toISOString();
    saveState({skipSync:true});
    return social().amigos;
  }catch(e){ return social().amigos; }
  finally{ _amigosCarregando=false; }
}

async function aceitarConvite(codigo){
  if(!socialDisponivel()) throw new Error('Entra na tua conta primeiro');
  const c=String(codigo||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'');
  if(c.length<6) throw new Error('Código curto demais');
  if(c===meuCodigo()) throw new Error('Esse código é o seu 🙂');
  if(social().amigos.length>=AMIGOS_MAX) throw new Error('Por enquanto dá pra ter no máximo '+AMIGOS_MAX+' pessoas');
  const r=await fetch(_syncBase()+'/rest/v1/rpc/aceitar_convite',{
    method:'POST', headers:_syncHeaders(), body:JSON.stringify({p_codigo:c})
  });
  if(!r.ok) throw new Error('Não consegui agora ('+r.status+')');
  const res=await r.json();
  if(!res||!res.ok) throw new Error((res&&res.erro)||'código não encontrado');
  await publicarCartao(true);
  await carregarAmigos();
  return res.nome||'';
}

async function removerAmigo(id){
  if(!socialDisponivel()) return false;
  const eu=usuarioAtual().id;
  const a=eu<id?eu:id, b=eu<id?id:eu;
  try{
    const r=await fetch(_syncBase()+'/rest/v1/constante_amizades?a=eq.'+encodeURIComponent(a)+'&b=eq.'+encodeURIComponent(b),
      {method:'DELETE',headers:_syncHeaders()});
    if(!r.ok) return false;
    social().amigos=social().amigos.filter(x=>x.id!==id);
    saveState({skipSync:true});
    return true;
  }catch(e){ return false; }
}

// ---------- telas ----------
function secaoAmigos(){
  if(!socialDisponivel()){
    return '<section class="card"><h2>Pessoas</h2>'
      +'<p class="sec small">Entra na tua conta pra dividir a constância com alguém — um amigo, teu primo, quem você quiser puxar junto.</p></section>';
  }
  const s=social(), amigos=s.amigos||[];
  let html='<section class="card"><h2>Pessoas'
    +'<button class="btn mini sec-btn dir" data-action="amigo-add">+ Adicionar</button></h2>';

  if(!amigos.length){
    html+='<p class="sec small">Ninguém por aqui ainda. Manda teu código pra alguém, ou entra com o código que te mandaram.</p>';
  } else {
    amigos.forEach(a=>{
      const anel=(typeof molduraTier==='function')?a.moldura:'semente';
      html+='<div class="linha" style="padding:0.5rem 0;border-bottom:1px solid var(--grid);gap:0.6rem">'
        +'<span class="avatar-anel anel-'+esc(anel)+' av-52" style="flex:none"><span class="avatar-inicial">'+esc((a.nome||'?').charAt(0).toUpperCase())+'</span></span>'
        +'<span class="esq"><b>'+esc(a.nome)+'</b>'
        +'<div class="muted small">'+(a.streak>0?'🔥 '+a.streak+(a.streak===1?' dia':' dias')+' de constância':'🌱 recomeçando')
        +(a.melhor>a.streak?' · recorde '+a.melhor:'')+'</div>'
        +(a.habitos&&a.habitos.length
          ? '<div class="small mt" style="display:flex;gap:0.3rem;flex-wrap:wrap">'
            +a.habitos.map(h=>'<span class="chip"'+(h.hoje?' style="border-color:var(--good)"':'')+'>'+esc(h.icone||'⭐')+' '+esc(h.nome)+(h.hoje?' ✓':'')+(h.streak>1?' <span class="muted">'+h.streak+'</span>':'')+'</span>').join('')
            +'</div>'
          : '<div class="muted small">não compartilhou nenhum hábito</div>')
        +'</span>'
        +'<button class="edit" data-action="amigo-del" data-id="'+esc(a.id)+'" aria-label="Remover">✕</button>'
        +'</div>';
    });
  }

  const meus=S.habits.filter(h=>habitoCompartilhado(h.id));
  html+='<div class="grupo-titulo mt">O que eles veem de você</div>'
    +'<p class="muted small">Teu nome, tua constância e tua moldura — sempre. Hábito, só o que você marcar aqui embaixo. Peso, dinheiro, humor, remédios, apostas e anotações <b>nunca</b> saem daqui.</p>';
  if(!S.habits.length){
    html+='<p class="muted small mt">Você ainda não tem hábito pra compartilhar.</p>';
  } else {
    html+='<div style="display:flex;gap:0.35rem;flex-wrap:wrap;margin-top:0.4rem">'
      +S.habits.map(h=>'<button type="button" class="chip-onb'+(habitoCompartilhado(h.id)?' sel':'')+'" data-action="amigo-hab" data-id="'+esc(h.id)+'" aria-pressed="'+(habitoCompartilhado(h.id)?'true':'false')+'">'+esc(h.icone||'⭐')+' '+esc(h.nome)+'</button>').join('')
      +'</div>'
      +'<p class="muted small mt">'+(meus.length?meus.length+' hábito'+(meus.length>1?'s':'')+' compartilhado'+(meus.length>1?'s':''):'Nenhum hábito compartilhado')+'.</p>';
  }
  return html+'</section>';
}

// ---------- Grupos: o contador que só anda quando o grupo bate ----------
// De 2 a 8 pessoas. Cada um escolhe qual hábito SEU conta ali. O contador anda
// no dia em que a meta for atingida (por padrão: todo mundo). Se um dia passar
// sem a meta, ele recomeça. É um contador do grupo — a constância individual de
// cada um não é afetada por nada disso.

const GRUPO_MAX = 8;

function grupos(){
  const s=social();
  if(!Array.isArray(s.grupos)) s.grupos=[];
  return s.grupos;
}
function metaGrupo(g){
  const n=(g.membros||[]).length||1;
  const m=Number(g.meta);
  return (m&&m>0)?Math.min(m,n):n;   // sem meta definida = todo mundo
}
function streakGrupo(g){
  if(!g||!Array.isArray(g.dias)) return 0;
  const meta=metaGrupo(g), porDia={};
  g.dias.forEach(r=>{
    if(!porDia[r.data]) porDia[r.data]=new Set();
    porDia[r.data].add(r.user_id);
  });
  const bateu=iso=>((porDia[iso]&&porDia[iso].size)||0)>=meta;
  let n=0, dia=hojeISO();
  if(bateu(dia)) n++;
  dia=addDias(dia,-1);
  while(bateu(dia)){ n++; dia=addDias(dia,-1); }
  return n;
}
function grupoHoje(g){
  const hoje=hojeISO();
  const quem=new Set((g.dias||[]).filter(x=>x.data===hoje).map(x=>x.user_id));
  return (g.membros||[]).map(m=>({...m, ok:quem.has(m.user_id)}));
}
function meuHabitoNoGrupo(g){
  const eu=(usuarioAtual()||{}).id;
  const m=(g.membros||[]).find(x=>x.user_id===eu);
  return m?m.habito:'';
}
function gruposDoHabito(idHabito){
  return grupos().filter(g=>meuHabitoNoGrupo(g)===idHabito);
}
function codigoNovo(){
  const abc='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let c=''; for(let i=0;i<6;i++) c+=abc[Math.floor(Math.random()*abc.length)];
  return c;
}
function meuPrimeiroNome(){ return String(S.profile.nome||'').trim().split(/\s+/)[0].slice(0,20); }

async function carregarGrupos(){
  if(!socialDisponivel()) return grupos();
  try{
    const rm=await fetch(_syncBase()+'/rest/v1/constante_grupo_membros?select=grupo_id,user_id,habito,nome',{headers:_syncHeaders()});
    if(!rm.ok) throw new Error('falha');
    const membros=await rm.json();
    const ids=[...new Set(membros.map(m=>m.grupo_id))];
    if(!ids.length){ social().grupos=[]; saveState({skipSync:true}); return []; }
    const lista='('+ids.map(encodeURIComponent).join(',')+')';
    const [rg,rd]=await Promise.all([
      fetch(_syncBase()+'/rest/v1/constante_grupos?select=id,nome,codigo,meta,criado_por&id=in.'+lista,{headers:_syncHeaders()}),
      fetch(_syncBase()+'/rest/v1/constante_grupo_dias?select=grupo_id,user_id,data&grupo_id=in.'+lista+'&data=gte.'+addDias(hojeISO(),-60),{headers:_syncHeaders()})
    ]);
    const gs=rg.ok?await rg.json():[];
    const dias=rd.ok?await rd.json():[];
    social().grupos=gs.map(g=>({
      ...g,
      membros:membros.filter(m=>m.grupo_id===g.id),
      dias:dias.filter(d=>d.grupo_id===g.id)
    }));
    saveState({skipSync:true});
    return social().grupos;
  }catch(e){ return grupos(); }
}

async function criarGrupo(nome, meuHabito){
  if(!socialDisponivel()) throw new Error('Entra na tua conta primeiro');
  const eu=usuarioAtual().id, codigo=codigoNovo();
  const rg=await fetch(_syncBase()+'/rest/v1/constante_grupos',{
    method:'POST', headers:{..._syncHeaders(),'Prefer':'return=representation'},
    body:JSON.stringify([{nome:String(nome||'Grupo').slice(0,40), codigo:codigo, meta:null, criado_por:eu}])
  });
  if(!rg.ok) throw new Error('Não consegui criar agora ('+rg.status+')');
  const g=(await rg.json())[0];
  const rm=await fetch(_syncBase()+'/rest/v1/constante_grupo_membros',{
    method:'POST', headers:{..._syncHeaders(),'Prefer':'resolution=merge-duplicates'},
    body:JSON.stringify([{grupo_id:g.id,user_id:eu,habito:meuHabito,nome:meuPrimeiroNome()}])
  });
  if(!rm.ok) throw new Error('Grupo criado, mas não consegui te colocar dentro');
  await carregarGrupos();
  await sincronizarGrupos();
  return g;
}

async function entrarNoGrupo(codigo, meuHabito){
  if(!socialDisponivel()) throw new Error('Entra na tua conta primeiro');
  const c=String(codigo||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'');
  if(c.length<4) throw new Error('Código curto demais');
  const r=await fetch(_syncBase()+'/rest/v1/rpc/entrar_no_grupo',{
    method:'POST', headers:_syncHeaders(),
    body:JSON.stringify({p_codigo:c,p_habito:meuHabito,p_nome:meuPrimeiroNome()})
  });
  if(!r.ok) throw new Error('Não consegui agora ('+r.status+')');
  const res=await r.json();
  if(!res||!res.ok) throw new Error((res&&res.erro)||'código não encontrado');
  await carregarGrupos();
  await sincronizarGrupos();
  return res.nome||'';
}

async function sairDoGrupo(id){
  if(!socialDisponivel()) return false;
  try{
    const eu=usuarioAtual().id;
    const r=await fetch(_syncBase()+'/rest/v1/constante_grupo_membros?grupo_id=eq.'+encodeURIComponent(id)+'&user_id=eq.'+encodeURIComponent(eu),
      {method:'DELETE',headers:_syncHeaders()});
    if(!r.ok) return false;
    social().grupos=grupos().filter(g=>g.id!==id);
    saveState({skipSync:true});
    return true;
  }catch(e){ return false; }
}

async function ajustarMetaGrupo(id, meta){
  if(!socialDisponivel()) return false;
  try{
    const r=await fetch(_syncBase()+'/rest/v1/constante_grupos?id=eq.'+encodeURIComponent(id),
      {method:'PATCH',headers:_syncHeaders(),body:JSON.stringify({meta:meta})});
    if(!r.ok) return false;
    const g=grupos().find(x=>x.id===id); if(g) g.meta=meta;
    saveState({skipSync:true});
    return true;
  }catch(e){ return false; }
}

// manda o meu lado do dia de hoje pra cada grupo
async function sincronizarGrupos(){
  if(!socialDisponivel()) return;
  const eu=usuarioAtual().id, hoje=hojeISO(), d=S.days[hoje]||{};
  for(const g of grupos()){
    const meu=meuHabitoNoGrupo(g);
    if(!meu) continue;
    const feito=!!(d.habitos&&d.habitos[meu]===true);
    const jaTem=(g.dias||[]).some(x=>x.user_id===eu&&x.data===hoje);
    if(feito===jaTem) continue;
    try{
      if(feito){
        await fetch(_syncBase()+'/rest/v1/constante_grupo_dias',{
          method:'POST', headers:{..._syncHeaders(),'Prefer':'resolution=ignore-duplicates'},
          body:JSON.stringify([{grupo_id:g.id,user_id:eu,data:hoje}])
        });
        g.dias=(g.dias||[]).concat([{grupo_id:g.id,user_id:eu,data:hoje}]);
      } else {
        await fetch(_syncBase()+'/rest/v1/constante_grupo_dias?grupo_id=eq.'+encodeURIComponent(g.id)
          +'&user_id=eq.'+encodeURIComponent(eu)+'&data=eq.'+hoje,{method:'DELETE',headers:_syncHeaders()});
        g.dias=(g.dias||[]).filter(x=>!(x.user_id===eu&&x.data===hoje));
      }
    }catch(e){}
  }
  saveState({skipSync:true});
}

function secaoGrupos(){
  if(!socialDisponivel()) return '';
  const lista=grupos();
  let html='<section class="card"><h2>Juntos'
    +'<button class="btn mini sec-btn dir" data-action="grupo-add">+ Grupo</button></h2>';
  if(!lista.length){
    html+='<p class="sec small">Um grupo de 2 a 8 pessoas com um hábito em comum: o contador só anda no dia em que o grupo bate a meta. Se um dia passar sem bater, ele recomeça — e a constância de cada um segue intacta.</p>';
    return html+'</section>';
  }
  html+='<p class="muted small">O contador anda no dia em que a meta do grupo é batida. A constância de cada um continua sendo dela.</p>';
  lista.forEach(g=>{
    const n=streakGrupo(g), hoje=grupoHoje(g), meta=metaGrupo(g), qtd=(g.membros||[]).length;
    const bateramHoje=hoje.filter(m=>m.ok).length;
    html+='<div class="mt" style="padding-bottom:0.6rem;border-bottom:1px solid var(--grid)">'
      +'<div class="linha" style="gap:0.6rem">'
      +'<span style="font-size:1.5rem;flex:none">'+(n>0?'🔥':'🌱')+'</span>'
      +'<span class="esq"><b>'+esc(g.nome||'Grupo')+'</b> <span class="chip">'+qtd+(qtd===1?' pessoa':' pessoas')+'</span>'
      +'<div class="muted small">'+(n>0?n+(n===1?' dia':' dias')+' seguidos':'ainda não começou')
      +' · meta: '+(meta>=qtd?'todo mundo':meta+' de '+qtd)+'</div></span>'
      +'<button class="edit" data-action="grupo-sair" data-id="'+esc(g.id)+'" aria-label="Sair do grupo">✕</button></div>'
      +'<div class="small mt" style="display:flex;gap:0.35rem;flex-wrap:wrap">'
      +hoje.map(m=>'<span class="chip"'+(m.ok?' style="border-color:var(--good)"':'')+'>'+(m.ok?'✅ ':'⬜ ')+esc(m.nome||'alguém')+'</span>').join('')
      +'</div>'
      +'<div class="muted small mt">'+bateramHoje+' de '+qtd+' bateram hoje'+(bateramHoje>=meta?' — o dia contou ✓':'')+'</div>'
      +'<div class="acoes mt" style="display:flex;gap:0.4rem;flex-wrap:wrap">'
      +'<button class="btn mini sec-btn" data-action="grupo-convidar" data-c="'+esc(g.codigo)+'" data-n="'+esc(g.nome||'Grupo')+'">Convidar</button>'
      +'<button class="btn mini sec-btn" data-action="grupo-meta" data-id="'+esc(g.id)+'">Mudar a meta</button>'
      +'</div></div>';
  });
  return html+'</section>';
}
