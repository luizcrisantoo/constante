/* ============================================================
   CONSTANTE — UI base: escape, modal, toast, SOS (respiração)
   ============================================================ */
'use strict';

function esc(s){
  return String(s==null?'':s)
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#39;');
}

function abrirModal(html){
  const root=document.getElementById('modal-root');
  root.innerHTML='<div class="modal-fundo" data-action="fechar-modal-fundo">'
    +'<div class="modal" role="dialog" aria-modal="true">'+html+'</div></div>';
  root.classList.remove('escondido');
}
function fecharModal(){
  const root=document.getElementById('modal-root');
  root.innerHTML=''; root.classList.add('escondido');
  pararRespiracao();
}

let _toastTimer=null;
function toast(msg){
  let el=document.getElementById('toast');
  if(!el){ el=document.createElement('div'); el.id='toast'; el.className='toast'; document.body.appendChild(el); }
  el.textContent=msg; el.style.display='block';
  clearTimeout(_toastTimer);
  _toastTimer=setTimeout(()=>{ el.style.display='none'; },2600);
}

/* ---------- SOS: respiração 4-7-8 + surf do impulso ---------- */
let _respTimer=null;
function abrirSOS(){
  abrirModal(
    '<h3>🌊 Surfa o impulso</h3>'
    +'<p class="sec small">Vontade de apostar, jogar ou quebrar um combinado? Ela é uma onda: sobe, faz pico e <b>sempre desce</b> — em geral em menos de 10 minutos. Respira comigo até ela passar.</p>'
    +'<div class="respira" id="respira-circulo">…</div>'
    +'<p class="centro sec" id="respira-texto">Preparando…</p>'
    +'<div class="acoes">'
    +'<button class="btn sec-btn" data-action="fechar-modal">Já passou 💪</button>'
    +'</div>'
    +'<p class="muted small mt">Depois: bebe um copo d’água, levanta da cadeira e muda de cômodo. Se quiser, registra o impulso vencido no hábito — cada onda surfada fortalece a próxima.</p>'
  );
  iniciarRespiracao();
}
function iniciarRespiracao(){
  const circ=document.getElementById('respira-circulo');
  const txt=document.getElementById('respira-texto');
  if(!circ) return;
  const ciclo=[
    {t:'Inspira pelo nariz',dur:4000,classe:'inspira',rot:'4s'},
    {t:'Segura',dur:7000,classe:'inspira',rot:'7s'},
    {t:'Solta devagar pela boca',dur:8000,classe:'',rot:'8s'}
  ];
  let i=0;
  const passo=()=>{
    const c=ciclo[i%3];
    circ.className='respira '+c.classe;
    circ.textContent=c.rot;
    txt.textContent=c.t+' — ciclo '+(Math.floor(i/3)+1)+' de 6';
    i++;
    if(i>=18){ txt.textContent='Muito bem. A onda passou? Se precisar, recomeça.'; return; }
    _respTimer=setTimeout(passo,c.dur);
  };
  passo();
}
function pararRespiracao(){ clearTimeout(_respTimer); }
