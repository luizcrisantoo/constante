'use strict';

const VAPID_PUBLICA = 'BBCkuS8n0jmdTx-AJu-Czc6hxRqWy-L2pzhz9ny_Gd4B6-kd8qM9xYLJi7lGXCokbWAMZu9Kr1fs2tCPtjekN6s';

function pushSuportado(){
  return 'serviceWorker' in navigator && 'PushManager' in window && typeof Notification!=='undefined';
}
function ehIOS(){
  const ua=navigator.userAgent||'';
  return /iP(hone|ad|od)/.test(ua) || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
}
function appInstalado(){
  return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone===true;
}
function permissaoNotif(){
  return (typeof Notification!=='undefined') ? Notification.permission : 'default';
}

function b64ParaUint8(base64){
  const pad='='.repeat((4 - base64.length % 4) % 4);
  const b64=(base64+pad).replace(/-/g,'+').replace(/_/g,'/');
  const raw=atob(b64);
  const arr=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++) arr[i]=raw.charCodeAt(i);
  return arr;
}

function secaoNotificacoes(){
  if(typeof produtoAtivo!=='function' || !produtoAtivo()) return '';
  let corpo;
  if(!pushSuportado()){
    corpo='<p class="muted small">Seu navegador não suporta notificações. Tenta pelo Chrome (Android/PC) ou pelo Safari com o app na tela inicial (iPhone).</p>';
  } else if(ehIOS() && !appInstalado()){
    corpo='<p class="sec small">📲 No iPhone, os lembretes só funcionam com o app na tela inicial. É rápido:</p>'
      +'<ol class="sec small" style="margin-left:1.1rem;line-height:1.6">'
      +'<li>Toque no botão <b>Compartilhar</b> do Safari (quadradinho com a setinha ↑).</li>'
      +'<li>Escolha <b>Adicionar à Tela de Início</b>.</li>'
      +'<li>Abra o Constante pelo ícone novo e volte aqui pra ativar.</li>'
      +'</ol>';
  } else if(permissaoNotif()==='granted'){
    corpo='<div class="ok-box">🔔 Lembretes ativados neste aparelho.</div>'
      +'<div class="acoes mt" style="display:flex;gap:0.5rem;flex-wrap:wrap">'
      +'<button class="btn sec-btn" data-action="notif-exemplo">ver exemplo</button>'
      +'<button class="btn sec-btn" data-action="notif-desativar">desativar aqui</button><button class="btn" data-action="notif-ativar">reativar</button></div>'
      +'<p class="muted small mt">O agendamento dos lembretes (dormir, refeições, hábitos) entra na próxima atualização.</p>';
  } else if(permissaoNotif()==='denied'){
    corpo='<p class="muted small">As notificações estão bloqueadas para este site nas configurações do navegador. Libere lá e volte aqui.</p>';
  } else {
    corpo='<p class="sec small">Receba lembretes na hora certa, mesmo com o app fechado.</p>'
      +'<button class="btn mt" data-action="notif-ativar">🔔 ativar lembretes</button>';
  }
  return '<section class="card"><h2>Lembretes (notificações)</h2>'+corpo+'</section>';
}

async function ativarLembretes(){
  if(!pushSuportado()){ toast('Navegador sem suporte a notificações'); return; }
  try{
    const perm=await Notification.requestPermission();
    if(perm!=='granted'){ toast('Permissão não concedida'); render(); return; }
    const reg=await navigator.serviceWorker.ready;
    let sub=await reg.pushManager.getSubscription();
    if(!sub){
      sub=await reg.pushManager.subscribe({ userVisibleOnly:true, applicationServerKey:b64ParaUint8(VAPID_PUBLICA) });
    }
    await guardarInscricao(sub);
    toast('🔔 Lembretes ativados!');
    render();
  }catch(e){ toast('❌ '+(e.message||'falha ao ativar')); render(); }
}

async function guardarInscricao(sub){
  const u=(typeof usuarioAtual==='function')?usuarioAtual():null;
  if(!u || !clienteSB()) return;
  const j=(sub && sub.toJSON) ? sub.toJSON() : sub;
  await clienteSB().from('push_subs').upsert({ user_id:u.id, endpoint:sub.endpoint, inscricao:j }, { onConflict:'user_id,endpoint' });
}

async function exemploNotificacao(){
  try{
    const reg=await navigator.serviceWorker.ready;
    await reg.showNotification('Constante', {
      body:'É assim que seus lembretes vão chegar ✨',
      icon:'assets/icons/icon-192.png', badge:'assets/icons/icon-192.png'
    });
  }catch(e){ toast('❌ '+e.message); }
}

async function desativarLembretes(){
  try{
    const reg=await navigator.serviceWorker.ready;
    const sub=await reg.pushManager.getSubscription();
    if(sub){
      const u=(typeof usuarioAtual==='function')?usuarioAtual():null;
      try{ if(u && clienteSB()) await clienteSB().from('push_subs').delete().eq('user_id',u.id).eq('endpoint',sub.endpoint); }catch(e){}
      await sub.unsubscribe();
    }
    toast('Lembretes desativados neste aparelho');
    render();
  }catch(e){ toast('❌ '+e.message); }
}

function secaoLembretes(){
  if(typeof produtoAtivo!=='function' || !produtoAtivo()) return '';
  const ls=(S.lembretes||[]).slice().sort((a,b)=>String(a.hora||'').localeCompare(String(b.hora||'')));
  let html='<section class="card"><h2>Meus lembretes <button class="btn mini sec-btn dir" data-action="lembrete-add">+ novo</button></h2>';
  if(!ls.length){
    html+='<p class="muted small">Nenhum lembrete ainda. Crie um (ex.: 22:00 · hora de dormir) — com as notificações ligadas, eles chegam sozinhos na hora certa.</p>';
  } else {
    html+='<div class="lista-edit">';
    ls.forEach(l=>{
      const dias=(Array.isArray(l.dias)&&l.dias.length&&l.dias.length<7)?l.dias.map(d=>DIAS_ABREV[d]).join(','):'todo dia';
      html+='<div class="item-edit"'+(l.ativo===false?' style="opacity:0.55"':'')+'><span class="num">'+esc(l.hora||'--:--')+'</span>'
        +'<span class="nome">'+esc(l.texto||'')+' <span class="muted small">('+esc(dias)+')</span></span>'
        +'<button class="btn mini sec-btn" data-action="lembrete-toggle" data-id="'+esc(l.id)+'">'+(l.ativo===false?'ligar':'pausar')+'</button>'
        +'<button class="btn mini sec-btn" data-action="lembrete-edit" data-id="'+esc(l.id)+'">✎</button>'
        +'<button class="btn mini perigo" data-action="lembrete-del" data-id="'+esc(l.id)+'">✕</button></div>';
    });
    html+='</div>';
  }
  html+='<div class="acoes mt" style="display:flex;gap:0.4rem;flex-wrap:wrap">'
    +'<button class="btn mini sec-btn" data-action="lembrete-preset" data-p="dormir">+ dormir</button>'
    +'<button class="btn mini sec-btn" data-action="lembrete-preset" data-p="agua">+ água</button>'
    +'<button class="btn mini sec-btn" data-action="lembrete-preset" data-p="estudar">+ estudar</button></div>';
  html+='<p class="muted small mt">Valem em todos os seus aparelhos com notificação ligada. Horário de Brasília.</p></section>';
  return html;
}

function abrirModalLembrete(id){
  const l=(S.lembretes||[]).find(x=>x.id===id)||{hora:'22:00',texto:'',dias:[],ativo:true};
  const dd=Array.isArray(l.dias)?l.dias:[];
  let checks='';
  for(let i=0;i<7;i++){
    checks+='<label style="display:inline-flex;align-items:center;gap:2px;margin-right:8px"><input type="checkbox" id="lb-d'+i+'" '+(dd.includes(i)?'checked':'')+' style="width:auto"> '+DIAS_ABREV[i]+'</label>';
  }
  abrirModal('<h3>'+(id?'Editar lembrete':'Novo lembrete')+'</h3>'
    +'<div class="campo"><label>Horário</label><input type="time" id="lb-hora" value="'+esc(l.hora||'22:00')+'"></div>'
    +'<div class="campo"><label>Mensagem</label><input type="text" id="lb-texto" maxlength="120" value="'+esc(l.texto||'')+'" placeholder="Ex.: Hora de dormir 😴"></div>'
    +'<div class="campo"><label>Dias (nenhum marcado = todo dia)</label><div style="line-height:2">'+checks+'</div></div>'
    +'<div class="acoes"><button class="btn sec-btn" data-action="fechar-modal">cancelar</button>'
    +'<button class="btn" data-action="lembrete-salvar" data-id="'+esc(id||'')+'">salvar</button></div>');
}

function salvarLembrete(id){
  const hora=(document.getElementById('lb-hora')||{}).value||'';
  const texto=((document.getElementById('lb-texto')||{}).value||'').trim();
  if(!/^\d{1,2}:\d{2}$/.test(hora)){ toast('Horário inválido'); return; }
  if(!texto){ toast('Escreve a mensagem do lembrete'); return; }
  const dias=[]; for(let i=0;i<7;i++){ const c=document.getElementById('lb-d'+i); if(c&&c.checked) dias.push(i); }
  if(!Array.isArray(S.lembretes)) S.lembretes=[];
  if(id){
    const l=S.lembretes.find(x=>x.id===id);
    if(l){ l.hora=hora; l.texto=texto.slice(0,120); l.dias=dias; }
  } else {
    S.lembretes.push({id:'lb'+uid(), hora:hora, texto:texto.slice(0,120), dias:dias, ativo:true});
  }
  saveState(); fecharModal(); render();
}

function addPresetLembrete(p){
  if(!Array.isArray(S.lembretes)) S.lembretes=[];
  let novo;
  if(p==='dormir'){ const h=(S.settings&&S.settings.sono&&S.settings.sono.deitar)||'22:30'; novo={id:'lb'+uid(),hora:h,texto:'Hora de dormir 😴',dias:[],ativo:true}; }
  else if(p==='agua'){ novo={id:'lb'+uid(),hora:'10:00',texto:'Bebe uma água 💧',dias:[],ativo:true}; }
  else { novo={id:'lb'+uid(),hora:'19:00',texto:'Bloco de estudo 📚',dias:[1,2,3,4,5],ativo:true}; }
  S.lembretes.push(novo);
  saveState(); render(); toast('Lembrete criado — ajusta se quiser ✏️');
}
