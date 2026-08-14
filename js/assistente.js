'use strict';

let _assistImgs = [];
let _assistMsgs = [];
let _assistBusy = false;

const TIPOS_BLOCO=['aula','estagio','treino','refeicao','estudo','sites','idioma','leitura','sono','livre','pausa','desloc','remedios','revisao'];

function assistenteDisponivel(){
  return typeof produtoAtivo==='function' && produtoAtivo() && typeof clienteSB==='function' && !!clienteSB()
    && typeof tokenAcesso==='function' && !!tokenAcesso();   // sem conta não há assistente (a chamada iria falhar com 401)
}

// ---- Fotografe seu plano: o caminho curto pra sair com tudo montado ----
const PLANOS_FOTO={
  dieta:{icone:'🍽️',nome:'Minha dieta',dica:'aquela que teu nutri passou',
    msg:'Essa é a dieta que eu sigo. Organiza ela aqui no app: cria as refeições nos horários certos e coloca os itens de cada uma. Não inventa nada — só transcreve e organiza o que está aí.'},
  treino:{icone:'🏋️',nome:'Minha ficha de treino',dica:'a ficha do personal',
    msg:'Essa é a minha ficha de treino. Organiza aqui: dá nome a cada treino, põe o foco e o dia da semana, e transcreve a lista de exercícios. Não inventa exercício nem carga — as cargas eu registro treinando.'},
  horario:{icone:'📅',nome:'Meu horário',dica:'da faculdade, da escola ou do trabalho',
    msg:'Esse é o meu horário fixo da semana. Monta a minha rotina a partir dele, com os blocos nos dias e horários certos.'},
  estudo:{icone:'📚',nome:'Meu plano de estudos',dica:'o cronograma que você segue',
    msg:'Esse é o meu plano de estudos. Distribui ele na minha rotina da semana, em blocos de estudo e revisão, nos dias e horários que combinem com o que já está lá.'}
};
// ---- Cadernos de estudo: resumir, mapa mental, me perguntar ----
let _assistCaderno = null;   // id do caderno que abriu a conversa (pra poder salvar a resposta lá)
const MODOS_CADERNO = {
  resumo:{
    titulo:'Resumo',
    instrucao:'Resume as minhas anotações abaixo em tópicos curtos, na ordem que fizer sentido pra estudar. Usa só o que está escrito, não inventa conteúdo nem acrescenta matéria que eu não anotei. Se algo estiver confuso ou incompleto, diz o que ficou faltando em vez de preencher por conta própria.'
  },
  mapa:{
    titulo:'Mapa mental',
    instrucao:'Monta um mapa mental em texto das minhas anotações abaixo: um tema central, os ramos principais e, dentro de cada um, os pontos. Usa recuo com hífens (nada de desenho nem tabela). Só com o que está escrito — não inventa ramo que eu não anotei.'
  },
  perguntas:{
    titulo:'Perguntas',
    instrucao:'Faz 8 perguntas curtas pra eu testar se aprendi o que está nas minhas anotações abaixo. Só perguntas, numeradas, sem as respostas — eu respondo e depois te peço a correção. Cada pergunta tem que ser respondível com o que está anotado.'
  }
};
function abrirCadernoIA(idCaderno,modo){
  const c=(typeof cadernoPorId==='function')?cadernoPorId(idCaderno):null;
  const m=MODOS_CADERNO[modo];
  if(!c||!m) return;
  if(!assistenteDisponivel()){ abrirAssistente(); return; }
  if(!c.notas.length){ toast('Esse caderno ainda não tem anotação'); return; }
  const notas=c.notas.slice().sort((a,b)=>(a.ts||a.data)<(b.ts||b.data)?-1:1);
  let texto='', cortou=false;
  for(const n of notas){
    const bloco='['+fmtData(n.data)+'] '+n.texto+'\n';
    if(texto.length+bloco.length>6000){ cortou=true; break; }
    texto+=bloco;
  }
  abrirAssistente();
  _assistCaderno=c.id;
  const ta=document.getElementById('assist-texto');
  if(ta) ta.value=m.instrucao+'\n\nCaderno "'+c.nome+'"'+(cortou?' (só as anotações mais antigas couberam)':'')+':\n'+texto;
  if(typeof metrica==='function') metrica('caderno-ia',{modo:modo});
  enviarMensagem();
}
function salvarRespostaNoCaderno(ix){
  const m=_assistMsgs[ix];
  if(!m||m.de!=='ia'||m.erro||!_assistCaderno) return;
  if(!(m.texto||'').trim()){ toast('Resposta vazia — nada pra salvar'); return; }
  if(typeof addNota!=='function'){ toast('Não consegui salvar'); return; }
  addNota(_assistCaderno,m.texto);
  m.salvo=true;
  render(); renderAssist();
  toast('📓 Salvo no caderno como anotação');
}

function abrirFotoPlano(){
  if(!assistenteDisponivel()){ abrirAssistente(); return; }
  abrirModal('<h3>📸 Fotografe seu plano</h3>'
    +'<p class="sec small">Manda a foto (ou o PDF) do que você já segue e o assistente monta tudo aqui dentro. Você revê antes de aplicar.</p>'
    +'<div class="acoes mt" style="flex-direction:column;gap:0.5rem">'
    +Object.keys(PLANOS_FOTO).map(k=>{
      const p=PLANOS_FOTO[k];
      return '<button class="btn sec-btn bloco" data-action="foto-plano-tipo" data-t="'+k+'" style="text-align:left">'
        +p.icone+' <b>'+esc(p.nome)+'</b> <span class="muted small">— '+esc(p.dica)+'</span></button>';
    }).join('')
    +'<button class="btn sec-btn bloco" data-action="fechar-modal">Cancelar</button>'
    +'</div>'
    +'<p class="muted small mt">Dieta e treino ele não inventa — só organiza o que você trouxer.</p>');
}
function escolherArquivoPlano(tipo){
  if(!PLANOS_FOTO[tipo]) return;
  if(!assistenteDisponivel()){ abrirAssistente(); return; }
  const inp=document.createElement('input');
  inp.type='file'; inp.accept='image/*,application/pdf';
  inp.style.display='none';
  document.body.appendChild(inp);
  inp.onchange=()=>{
    const arq=inp.files&&inp.files[0];
    document.body.removeChild(inp);
    if(!arq) return;
    const erro=e=>toast('❌ '+(e&&e.message||e));
    if(arq.type==='application/pdf'){
      if(arq.size>4*1024*1024){ toast('PDF muito grande (máx. ~4MB).'); return; }
      lerPdfBase64(arq).then(an=>abrirAssistenteComPlano(an,tipo)).catch(erro);
    } else {
      lerImagemReduzida(arq).then(im=>abrirAssistenteComPlano(im,tipo)).catch(erro);
    }
  };
  inp.click();
}
function abrirAssistenteComPlano(anexo,tipo){
  abrirAssistente();
  if(!assistenteDisponivel()) return;
  _assistImgs=[anexo];
  renderAssist();
  const ta=document.getElementById('assist-texto');
  if(ta) ta.value=(PLANOS_FOTO[tipo]||{}).msg||'';
  if(typeof metrica==='function') metrica('foto-plano',{tipo:tipo});
  enviarMensagem();
}

function abrirAssistente(){
  _assistImgs = [];
  _assistCaderno = null;
  if(!assistenteDisponivel()){
    abrirModal('<h3>🤖 Assistente</h3>'
      +'<p class="sec small">O assistente funciona quando você está na sua conta — é assim que ele enxerga tua rotina e te acompanha em qualquer aparelho. Entra (ou cria a conta) e volta aqui 🙂</p>'
      +'<div class="acoes"><button class="btn" data-action="fechar-modal">Ok</button></div>');
    return;
  }
  _assistMsgs = [{de:'ia', texto:'Oi! 👋 Eu organizo e ajusto o teu dia aqui — rotina, hábitos, sono, e a dieta/treino que você já tem. Manda tua dieta ou teu treino em PDF (ou foto) que eu encaixo nos horários e dias. Dieta e treino eu não invento (isso é com teu nutri/personal) — só organizo e ajusto o que você trouxer.', plano:null, opcoes:['Organizar minha dieta','Organizar meu treino','Montar minha rotina','Fazer um ajuste no dia']}];
  _assistBusy = false;
  abrirModal(chatHTML());
  const th=document.getElementById('chat-thread'); if(th) th.scrollTop=th.scrollHeight;
}

function chatHTML(){
  let thread='';
  _assistMsgs.forEach((m,ix)=>{
    if(m.de==='voce'){
      thread+='<div style="display:flex;justify-content:flex-end;margin:6px 0"><div style="max-width:82%;background:var(--brand);color:#fff;padding:0.5rem 0.7rem;border-radius:14px 14px 3px 14px">'
        +esc(m.texto).replace(/\n/g,'<br>')+(m.imgs?' <span class="small">📷×'+m.imgs+'</span>':'')+'</div></div>';
    } else {
      thread+='<div style="display:flex;justify-content:flex-start;margin:6px 0"><div style="max-width:88%">'
        +'<div style="background:var(--surface-2);padding:0.5rem 0.7rem;border-radius:14px 14px 14px 3px">'+esc(m.texto).replace(/\n/g,'<br>')+'</div>';
      if(m.opcoes&&m.opcoes.length&&ix===_assistMsgs.length-1&&!_assistBusy){
        thread+='<div style="display:flex;gap:0.4rem;flex-wrap:wrap;margin-top:6px">'
          +m.opcoes.map(o=>'<button class="btn mini sec-btn" data-action="assist-chip" data-v="'+esc(o)+'">'+esc(o)+'</button>').join('')+'</div>';
      }
      if(_assistCaderno&&ix>0&&!m.plano&&!m.erro){
        thread+='<div class="mt">'
          +(m.salvo
            ? '<span class="chip">📓 salvo no caderno</span>'
            : '<button class="btn mini sec-btn" data-action="assist-salvar-caderno" data-ix="'+ix+'">📓 Salvar no caderno</button>')
          +'</div>';
      }
      if(m.plano){
        thread+='<div class="ok-box" style="margin-top:6px">🔧 '+esc(previaPlano(m.plano));
        if(m.aplicado) thread+=' <b>✅ aplicado</b>';
        else thread+='<div class="mt"><button class="btn mini" data-action="assist-aplicar" data-ix="'+ix+'">Aplicar</button></div>';
        thread+='</div>';
      }
      thread+='</div></div>';
    }
  });
  if(_assistBusy){
    thread+='<div style="display:flex;justify-content:flex-start;margin:6px 0"><div style="background:var(--surface-2);color:var(--ink-mute);padding:0.5rem 0.7rem;border-radius:14px">digitando… ⏳</div></div>';
  }
  const chips=_assistImgs.map((im,ix)=>'<span class="chip">'+(im&&im.media_type==='application/pdf'?'📄 '+esc(im.nome||'PDF'):'📷 '+(ix+1))+' <button data-action="assist-remimg" data-ix="'+ix+'" style="color:var(--critical)">✕</button></span>').join(' ');
  return '<h3>🤖 Assistente</h3>'
    +'<div id="chat-thread" style="max-height:46vh;overflow-y:auto;padding:4px 2px;margin-bottom:8px">'+thread+'</div>'
    +(chips?'<div class="small" style="margin-bottom:6px">'+chips+'</div>':'')
    +'<textarea id="assist-texto" rows="2" placeholder="Escreve aqui… ex.: divide o lanche da tarde nas outras refeições"'+(_assistBusy?' disabled':'')+'></textarea>'
    +'<input type="file" id="assist-file" accept="image/*,application/pdf" class="escondido">'
    +'<div class="acoes mt" style="display:flex;gap:0.5rem;flex-wrap:wrap">'
    +'<button class="btn sec-btn" data-action="assist-foto"'+(_assistBusy?' disabled':'')+'>📎 Anexar</button>'
    +'<button class="btn sec-btn" data-action="fechar-modal">Fechar</button>'
    +'<button class="btn" data-action="assist-enviar"'+(_assistBusy?' disabled':'')+'>Enviar ▸</button>'
    +'</div>'
    +'<p class="muted small mt">O assistente enxerga sua rotina/dieta atual pra sugerir com contexto. Tudo o que ele propõe você revê e aplica.</p>';
}

function renderAssist(){
  const m=document.querySelector('.modal');
  if(!m) return;
  const ta=document.getElementById('assist-texto');
  const val=ta?ta.value:'';
  m.innerHTML=chatHTML();
  const ta2=document.getElementById('assist-texto');
  if(ta2 && val) ta2.value=val;
  const th=document.getElementById('chat-thread'); if(th) th.scrollTop=th.scrollHeight;
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

function lerPdfBase64(file){
  return new Promise((resolve,reject)=>{
    if(!file || file.type!=='application/pdf'){ reject(new Error('não é PDF')); return; }
    const fr=new FileReader();
    fr.onerror=()=>reject(new Error('falha ao ler o PDF'));
    fr.onload=()=>{
      const s=String(fr.result||'');
      const base64=s.includes(',')?s.split(',')[1]:s;
      if(!base64){ reject(new Error('PDF vazio')); return; }
      resolve({base64, media_type:'application/pdf', nome:String(file.name||'documento.pdf').slice(0,60)});
    };
    fr.readAsDataURL(file);
  });
}

function resumoEstadoAssist(){
  const refs=(S.diet.refeicoes||[]).map(r=>({id:r.id, nome:r.nome, hora:r.hora, itens:(r.itens||[]).slice(0,20)}));
  const habs=(S.habits||[]).map(h=>({id:h.id, nome:h.nome, tipo:h.tipo, dias:h.dias}));
  const rot=(S.routine||[]).map(b=>({d:b.d, i:b.i, f:b.f||'', t:b.t, tipo:b.tipo}));
  return {
    nome:(S.profile.nome||''),
    kcalAlvo:S.profile.kcalAlvo,
    sono:{deitar:S.settings.sono.deitar, acordar:S.settings.sono.acordar},
    refeicoes:refs, habitos:habs, rotina:rot
  };
}

async function enviarMensagem(){
  if(_assistBusy) return;
  const ta=document.getElementById('assist-texto');
  const texto=((ta&&ta.value)||'').trim();
  if(!texto && !_assistImgs.length) return;
  if(ta) ta.value='';
  const imagensEnvio=_assistImgs.slice();
  _assistMsgs.push({de:'voce', texto: texto || '(foto)', imgs: imagensEnvio.length});
  _assistImgs=[];
  _assistBusy=true;
  renderAssist();
  try{
    const {data,error}=await clienteSB().functions.invoke('assistente',{
      body:{ mensagens:_assistMsgs.map(m=>({de:m.de, texto:m.texto})), estado:resumoEstadoAssist(), imagens:imagensEnvio }
    });
    if(error) throw new Error(error.message||'falha na chamada');
    if(!data || data.erro) throw new Error((data&&data.erro)||'resposta vazia');
    let resp=(data.resposta||'').trim();
    const plano=data.plano||null;
    // O modelo pode terminar com uma linha "OPCOES: a | b | c" → vira botões de resposta rápida
    let opcoes=null;
    const mOp=resp.match(/(?:^|\n)\s*OP(?:Ç|C)(?:Õ|O)ES?:\s*(.+)\s*$/i);
    if(mOp){
      opcoes=mOp[1].split('|').map(s=>s.trim()).filter(Boolean).slice(0,5);
      resp=resp.slice(0,mOp.index).trim();
      if(!opcoes.length) opcoes=null;
    }
    const txt=resp || (plano&&plano.resumo) || 'Prontinho.';
    _assistMsgs.push({de:'ia', texto:txt, plano:plano, aplicado:false, opcoes:opcoes});
  }catch(e){
    _assistMsgs.push({de:'ia', texto:'❌ '+e.message, plano:null, erro:true});
  }
  _assistBusy=false;
  renderAssist();
}

function previaPlano(p){
  const add=[], edt=[], rem=[];
  (p.refeicoes||[]).forEach(r=>{ if(r.id&&r.remover) rem.push('refeição'); else if(r.id) edt.push('refeição'); else if(r.nome) add.push('refeição'); });
  (p.habitos||[]).forEach(h=>{ if(h.id&&h.remover) rem.push('hábito'); else if(h.id) edt.push('hábito'); else if(h.nome) add.push('hábito'); });
  (p.rotina||[]).forEach(()=>add.push('bloco'));
  (p.treinos||[]).forEach(()=>edt.push('treino'));
  const partes=[];
  const plz=(w,n)=>n<=1?w:(w==='refeição'?'refeições':w+'s');
  const cont=(arr,verbo)=>{
    if(!arr.length) return;
    const g={}; arr.forEach(x=>g[x]=(g[x]||0)+1);
    partes.push(verbo+' '+Object.keys(g).map(k=>g[k]+' '+plz(k,g[k])).join(', '));
  };
  cont(add,'adicionar'); cont(edt,'editar'); cont(rem,'remover');
  const base=p.resumo?String(p.resumo):'';
  return (base?base+' ':'')+(partes.length?'('+partes.join(' · ')+')':'sem mudanças');
}

function aplicarPlano(p){
  if(!p||typeof p!=='object') return;
  if(p.nome && !(S.profile.nome||'').trim()) S.profile.nome=String(p.nome).slice(0,40);
  if(p.sono && typeof p.sono==='object'){
    if(/^\d{1,2}:\d{2}$/.test(p.sono.deitar||'')) S.settings.sono.deitar=p.sono.deitar;
    if(/^\d{1,2}:\d{2}$/.test(p.sono.acordar||'')) S.settings.sono.acordar=p.sono.acordar;
  }
  if(Array.isArray(p.habitos)) p.habitos.forEach(h=>{
    if(!h) return;
    if(h.id){
      const alvo=S.habits.find(x=>x.id===h.id); if(!alvo) return;
      if(h.remover){ S.habits=S.habits.filter(x=>x.id!==h.id); return; }
      if(h.nome) alvo.nome=String(h.nome).slice(0,80);
      if(h.icone) alvo.icone=String(h.icone).slice(0,4);
      if(h.tipo) alvo.tipo=h.tipo==='evitar'?'evitar':'fazer';
      if(Array.isArray(h.dias)){ const d=h.dias.map(Number).filter(x=>x>=0&&x<=6); if(d.length) alvo.dias=d; }
      return;
    }
    if(!h.nome) return;
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
    if(!r) return;
    if(r.id){
      const alvo=S.diet.refeicoes.find(x=>x.id===r.id); if(!alvo) return;
      if(r.remover){ S.diet.refeicoes=S.diet.refeicoes.filter(x=>x.id!==r.id); return; }
      if(r.nome) alvo.nome=String(r.nome).slice(0,60);
      if(r.hora!=null) alvo.hora=String(r.hora).slice(0,20);
      if(Array.isArray(r.itens)) alvo.itens=r.itens.map(x=>String(x).slice(0,120)).slice(0,40);
      return;
    }
    if(!r.nome) return;
    S.diet.refeicoes.push({id:'ref'+uid(), nome:String(r.nome).slice(0,60), hora:String(r.hora||'').slice(0,20),
      kcal:0, prot:0, itens:Array.isArray(r.itens)?r.itens.map(x=>String(x).slice(0,120)).slice(0,40):[], subs:[]});
  });
  if(Array.isArray(p.treinos)){
    const contSem={A:0,B:0};
    p.treinos.forEach(t=>{
      if(!t) return;
      const sem=(t.semana==='B')?'B':'A';
      const fichas=S.treinos.split.filter(x=>x.semana===sem);
      const alvo=fichas[contSem[sem]++]; if(!alvo) return;
      if(t.nome) alvo.nome=String(t.nome).slice(0,40);
      if(t.dia) alvo.dia=String(t.dia).slice(0,20);
      if(t.foco) alvo.foco=String(t.foco).slice(0,140);
      if(Number.isInteger(t.diaSemana)&&t.diaSemana>=0&&t.diaSemana<=6) alvo.diaSemana=t.diaSemana;
      if(Array.isArray(t.exercicios)) t.exercicios.slice(0,25).forEach(nomeEx=>{
        const nomeL=String(nomeEx||'').trim().slice(0,80); if(!nomeL) return;
        if(!alvo.exercicios.some(e=>e&&e.nome&&e.nome.toLowerCase()===nomeL.toLowerCase()))
          alvo.exercicios.push({id:'ex'+uid(), nome:nomeL, registros:[]});
      });
    });
  }
  saveState();
}
