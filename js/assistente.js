'use strict';

let _assistImgs = [];

function assistenteDisponivel(){
  return typeof produtoAtivo==='function' && produtoAtivo() && typeof clienteSB==='function' && clienteSB();
}

function abrirAssistente(){
  _assistImgs = [];
  if(!assistenteDisponivel()){
    abrirModal('<h3>🤖 Assistente</h3>'
      +'<p class="sec small">O assistente monta sua rotina a partir do que você contar ou de uma foto do seu horário — mas ele só funciona com a conta conectada (modo produto).</p>'
      +'<div class="acoes"><button class="btn" data-action="fechar-modal">ok</button></div>');
    return;
  }
  abrirModal(assistenteHTML());
}

function assistenteHTML(estado){
  const imgs = _assistImgs.map((im,ix)=>'<span class="chip">📷 foto '+(ix+1)+' <button data-action="assist-remimg" data-ix="'+ix+'" style="color:var(--critical)">✕</button></span>').join(' ');
  return '<h3>🤖 Montar minha rotina</h3>'
    +'<p class="sec small">Me conta sobre sua rotina em texto livre, e/ou anexa uma foto do seu quadro de horário. Eu organizo tudo pra você revisar.</p>'
    +'<div class="campo mt"><label>Conte sobre sua rotina, dieta, treino…</label>'
    +'<textarea id="assist-texto" rows="5" placeholder="Ex.: Tenho aula de Cálculo seg e qua das 8h às 10h. Treino seg/qua/sex à noite. Quero ler todo dia e dormir 23h. Tomo vitamina D de manhã."></textarea></div>'
    +'<div class="mt"><button class="btn sec-btn" data-action="assist-foto">📷 anexar foto do horário</button> '
    +'<span class="small">'+imgs+'</span>'
    +'<input type="file" id="assist-file" accept="image/*" class="escondido"></div>'
    +'<div id="assist-status" class="muted small mt"></div>'
    +'<div class="acoes mt"><button class="btn sec-btn" data-action="fechar-modal">cancelar</button>'
    +'<button class="btn" data-action="assist-enviar">✨ montar minha rotina</button></div>'
    +'<p class="muted small mt">Tem a dieta em PDF? Copia o texto dele e cola aí em cima — ou tira uma foto/print. (Leitura automática de PDF chega em breve.)</p>';
}

function assistStatus(msg, erro){
  const el=document.getElementById('assist-status');
  if(el){ el.textContent=msg||''; el.style.color=erro?'var(--critical)':'var(--ink-mute)'; }
}

function lerImagemReduzida(file){
  return new Promise((resolve,reject)=>{
    if(!file || !/^image\//.test(file.type)){ reject(new Error('arquivo não é imagem')); return; }
    const img=new Image();
    const fr=new FileReader();
    fr.onload=()=>{ img.src=fr.result; };
    fr.onerror=()=>reject(new Error('falha ao ler'));
    img.onload=()=>{
      const MAX=1568;
      let {width:w,height:h}=img;
      if(w>MAX||h>MAX){ const r=Math.min(MAX/w,MAX/h); w=Math.round(w*r); h=Math.round(h*r); }
      const cv=document.createElement('canvas'); cv.width=w; cv.height=h;
      cv.getContext('2d').drawImage(img,0,0,w,h);
      const dataUrl=cv.toDataURL('image/jpeg',0.85);
      const base64=dataUrl.split(',')[1];
      resolve({base64, media_type:'image/jpeg'});
    };
    img.onerror=()=>reject(new Error('imagem inválida'));
    fr.readAsDataURL(file);
  });
}

async function enviarAssistente(){
  const texto=(document.getElementById('assist-texto')||{}).value||'';
  if(!texto.trim() && !_assistImgs.length){ assistStatus('Escreve algo ou anexa uma foto primeiro.',true); return; }
  assistStatus('Montando sua rotina… (uns segundos)');
  const btns=document.querySelectorAll('.modal [data-action="assist-enviar"]');
  btns.forEach(b=>b.disabled=true);
  try{
    const {data,error}=await clienteSB().functions.invoke('assistente',{
      body:{ texto:texto.trim(), imagens:_assistImgs }
    });
    if(error) throw new Error(error.message||'falha na chamada');
    if(!data || data.erro) throw new Error((data&&data.erro)||'resposta vazia');
    if(!data.plano) throw new Error('a IA não devolveu um plano');
    mostrarPlano(data.plano);
  }catch(e){
    assistStatus('❌ '+e.message, true);
    btns.forEach(b=>b.disabled=false);
  }
}

function contarPlano(p){
  return {
    hab:(p.habitos||[]).length,
    blocos:(p.rotina||[]).length,
    ref:(p.refeicoes||[]).length,
    tre:(p.treinos||[]).length
  };
}

function mostrarPlano(plano){
  _planoPendente=plano;
  const c=contarPlano(plano);
  let itens=[];
  if(c.blocos) itens.push(c.blocos+' blocos de rotina');
  if(c.hab) itens.push(c.hab+' hábito'+(c.hab>1?'s':''));
  if(c.ref) itens.push(c.ref+' refeiç'+(c.ref>1?'ões':'ão'));
  if(c.tre) itens.push(c.tre+' treino'+(c.tre>1?'s':''));
  abrirModal('<h3>✨ Prontinho!</h3>'
    +'<p class="sec">'+esc(plano.resumo||'Montei um plano inicial pra você.')+'</p>'
    +(itens.length?'<div class="ok-box mt">Vou adicionar: '+esc(itens.join(' · '))+'.</div>':'')
    +'<p class="muted small mt">Isso <b>soma</b> à sua rotina atual — depois você edita ou remove o que não quiser.</p>'
    +'<div class="acoes mt"><button class="btn sec-btn" data-action="assist-abrir">refazer</button>'
    +'<button class="btn" data-action="assist-aplicar">aplicar na minha rotina</button></div>');
}

let _planoPendente=null;
const TIPOS_BLOCO=['aula','estagio','treino','refeicao','estudo','sites','idioma','leitura','sono','livre','pausa','desloc','remedios','revisao'];

function aplicarPlano(p){
  if(!p||typeof p!=='object') return;
  if(p.nome && !(S.profile.nome||'').trim()) S.profile.nome=String(p.nome).slice(0,40);
  if(p.sono && typeof p.sono==='object'){
    if(/^\d{1,2}:\d{2}$/.test(p.sono.deitar||'')) S.settings.sono.deitar=p.sono.deitar;
    if(/^\d{1,2}:\d{2}$/.test(p.sono.acordar||'')) S.settings.sono.acordar=p.sono.acordar;
  }
  if(Array.isArray(p.habitos)) p.habitos.forEach(h=>{
    if(!h||!h.nome) return;
    const dias=Array.isArray(h.dias)?h.dias.map(Number).filter(d=>d>=0&&d<=6):[];
    S.habits.push({id:'hb'+uid(), nome:String(h.nome).slice(0,80), icone:String(h.icone||'⭐').slice(0,4),
      tipo:h.tipo==='evitar'?'evitar':'fazer', dias:dias.length?dias:[0,1,2,3,4,5,6], xp:15});
  });
  if(Array.isArray(p.rotina)) p.rotina.forEach(b=>{
    if(!b||b.d==null||!b.i||!b.t) return;
    if(!/^\d{1,2}:\d{2}$/.test(String(b.i))) return;
    const novo={d:Number(b.d), i:String(b.i), t:String(b.t).slice(0,120), tipo:TIPOS_BLOCO.includes(b.tipo)?b.tipo:'livre'};
    if(/^\d{1,2}:\d{2}$/.test(String(b.f||''))) novo.f=String(b.f);
    if(novo.d>=0&&novo.d<=6) S.routine.push(novo);
  });
  if(Array.isArray(p.refeicoes)) p.refeicoes.forEach(r=>{
    if(!r||!r.nome) return;
    S.diet.refeicoes.push({id:'ref'+uid(), nome:String(r.nome).slice(0,60), hora:String(r.hora||'').slice(0,20),
      kcal:0, prot:0, itens:Array.isArray(r.itens)?r.itens.map(x=>String(x).slice(0,120)).slice(0,40):[], subs:[]});
  });
  if(Array.isArray(p.treinos)) p.treinos.forEach((t,i)=>{
    const alvo=S.treinos.split[i]; if(!alvo||!t) return;
    if(t.nome) alvo.nome=String(t.nome).slice(0,40);
    if(t.dia) alvo.dia=String(t.dia).slice(0,20);
    if(t.foco) alvo.foco=String(t.foco).slice(0,140);
  });
  saveState();
}
