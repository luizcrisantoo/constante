'use strict';

// ---------- Card pra compartilhar (stories) ----------
// Especificação de design: o card É o logo com um número dentro. O anel roxo com a
// linha azul atravessando não é um selo aplicado no canto — é a estrutura do layout.
//
// Regras que não se negociam aqui:
// • sem gradiente, sem brilho, sem emoji, sem metal — "respiração, nunca pisca-pisca"
// • sem link e sem @: a identificação é só a assinatura tipográfica (curiosidade)
// • nunca entram peso, dinheiro, humor, remédios, apostas ou anotações

const CARDS_COMPARTILHA = {
  constancia: { nome:'Constância', kicker:'constância' },
  semana:     { nome:'Semana',     kicker:'últimos 7 dias' },
  treino:     { nome:'Treinos',    kicker:'treinos da semana' }
};

// Escala da moldura em roxo: progressão sem pódio. O topo é a própria cor da marca.
const TIER_CARD = {
  semente:  { cor:'#6d6a8f', arco:0.15 },
  bronze:   { cor:'#7b70cf', arco:0.35 },
  prata:    { cor:'#9085e9', arco:0.60 },
  ouro:     { cor:'#a89ef0', arco:0.85 },
  ametista: { cor:'#a89ef0', arco:1.00 }
};

const C = {
  fundo:'#0d0d0d', tinta:'#ffffff', tinta2:'#c3c2b7', apagado:'#898781',
  marca:'#9085e9', marcaForte:'#a89ef0', linha:'#3987e5',
  trilho:'rgba(255,255,255,0.10)', vazio:'#383835', chipFundo:'#1a1a19',
  neutroFundo:'rgba(57,135,229,0.18)'
};
const FONTE = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

let _cardTipo = 'constancia';
let _cardNome = true;

function dadosCard(){
  const st  = (typeof streakGeral==='function') ? streakGeral() : 0;
  const rec = (typeof melhorStreak==='function') ? melhorStreak() : 0;
  const tier= (typeof molduraTier==='function') ? molduraTier() : {id:'semente',nome:'Semente'};
  const tr  = (typeof treinosNaSemana==='function') ? treinosNaSemana() : 0;
  const dias=[];
  for(let i=6;i>=0;i--){
    const iso=addDias(hojeISO(),-i), d=S.days[iso];
    dias.push({
      xp:(d&&d.xp)||0,
      bateu:(typeof diaConta==='function')?diaConta(iso):false,
      neutro:(typeof diaNeutro==='function')?diaNeutro(iso):false,
      treino:!!(d&&d.treino)
    });
  }
  const nome=(S.profile.nome||'').trim().split(/\s+/)[0].toLowerCase().slice(0,18);
  return { st, rec, tier, tr, dias, nome, batidos:dias.filter(x=>x.bateu).length };
}

// ---- ajudantes de desenho ----
function fnt(px,peso){ return (peso||700)+' '+px+'px '+FONTE; }
function larguraReal(g,txt){
  const m=g.measureText(txt);
  if(m.actualBoundingBoxLeft!=null&&m.actualBoundingBoxRight!=null) return m.actualBoundingBoxLeft+m.actualBoundingBoxRight;
  return m.width;
}
// centraliza pelo desenho real do número (o "1" é mais estreito e desalinha se centralizar pelo avanço)
function textoCentrado(g,txt,cx,y){
  const m=g.measureText(txt);
  if(m.actualBoundingBoxLeft!=null&&m.actualBoundingBoxRight!=null){
    const centroReal=(m.actualBoundingBoxRight-m.actualBoundingBoxLeft)/2;
    g.textAlign='left';
    g.fillText(txt,cx-centroReal-m.actualBoundingBoxLeft,y);
    g.textAlign='center';
  } else { g.fillText(txt,cx,y); }
}
function textoEspacado(g,txt,cx,y,tracking){
  const t=tracking||0;
  let total=0;
  for(const ch of txt) total+=g.measureText(ch).width+t;
  total-=t;
  let x=cx-total/2;
  g.textAlign='left';
  for(const ch of txt){ g.fillText(ch,x,y); x+=g.measureText(ch).width+t; }
  g.textAlign='center';
  return total;
}
function barraArredondada(g,cx,base,larg,alt,raio){
  const y0=base-alt, x0=cx-larg/2, x1=cx+larg/2, r=Math.min(raio,alt/2,larg/2);
  g.beginPath();
  g.moveTo(x0,base); g.lineTo(x0,y0+r);
  g.quadraticCurveTo(x0,y0,x0+r,y0);
  g.lineTo(x1-r,y0);
  g.quadraticCurveTo(x1,y0,x1,y0+r);
  g.lineTo(x1,base); g.closePath();
}

// ---- a assinatura: "constante", só o "o" na cor da marca ----
function assinatura(g,cx,y,px){
  g.font=fnt(px,800);
  const tr=1.4, partes=[['c',C.tinta],['o',C.marcaForte],['nstante',C.tinta]];
  let total=0;
  partes.forEach(p=>{ for(const ch of p[0]) total+=g.measureText(ch).width+tr; });
  total-=tr;
  let x=cx-total/2;
  g.textAlign='left';
  partes.forEach(p=>{
    g.fillStyle=p[1];
    for(const ch of p[0]){ g.fillText(ch,x,y); x+=g.measureText(ch).width+tr; }
  });
  g.textAlign='center';
}

// Encolhe o herói até caber DENTRO do círculo na altura em que ele é mais largo —
// o vão do anel estreita rápido conforme o glifo sobe.
function desenhaHeroi(g,txt,cx,baseY,cyAnel,tamInicial,minimo){
  let px=tamInicial;
  for(let i=0;i<60;i++){
    g.font=fnt(px,800);
    const m=g.measureText(txt);
    const larg=larguraReal(g,txt);
    const alt=m.actualBoundingBoxAscent||px*0.72;
    const distTopo=Math.max(0,Math.min(290,cyAnel-(baseY-alt)));
    const vao=2*Math.sqrt(Math.max(1,292*292-distTopo*distTopo))-56;
    if(larg<=Math.min(470,vao)||px<=minimo) break;
    px-=6;
  }
  textoCentrado(g,txt,cx,baseY);
}

function desenharCard(cv, dd){
  const W=cv.width, H=cv.height, g=cv.getContext('2d');
  const cx=540, cyAnel=740;
  const t=TIER_CARD[dd.tier.id]||TIER_CARD.semente;

  g.fillStyle=C.fundo; g.fillRect(0,0,W,H);
  // única concessão de gradiente do card inteiro: uma vinheta que quase não se vê
  const vin=g.createRadialGradient(cx,cyAnel,0,cx,cyAnel,980);
  vin.addColorStop(0,'rgba(144,133,233,0.05)'); vin.addColorStop(1,'rgba(144,133,233,0)');
  g.fillStyle=vin; g.fillRect(0,0,W,H);
  g.textAlign='center'; g.textBaseline='alphabetic';

  // kicker
  g.fillStyle=C.apagado; g.font=fnt(28,600);
  textoEspacado(g,(CARDS_COMPARTILHA[_cardTipo]||CARDS_COMPARTILHA.constancia).kicker,cx,336,6);

  // halo do tier (fora do anel, fininho — nunca encosta no logo)
  let fracao=t.arco;
  if(_cardTipo==='semana') fracao=dd.batidos/7;
  if(_cardTipo==='treino') fracao=Math.min(1,dd.tr/7);
  g.lineWidth=6; g.strokeStyle=C.trilho;
  g.beginPath(); g.arc(cx,cyAnel,346,0,Math.PI*2); g.stroke();
  if(fracao>0){
    g.strokeStyle=(_cardTipo==='constancia')?t.cor:C.marca;
    g.beginPath(); g.arc(cx,cyAnel,346,-Math.PI/2,-Math.PI/2+Math.PI*2*fracao); g.stroke();
  }
  if(dd.tier.id==='ametista'&&_cardTipo==='constancia'){
    g.lineWidth=2; g.strokeStyle='rgba(168,158,240,0.35)';
    g.beginPath(); g.arc(cx,cyAnel,360,0,Math.PI*2); g.stroke();
  }

  // O LOGO: anel + linha que atravessa (a linha nunca é interrompida)
  g.lineWidth=28; g.strokeStyle=C.marca;
  g.beginPath(); g.arc(cx,cyAnel,306,0,Math.PI*2); g.stroke();
  g.lineWidth=20; g.strokeStyle=C.linha; g.lineCap='butt';
  g.beginPath(); g.moveTo(248,cyAnel); g.lineTo(832,cyAnel); g.stroke();
  g.fillStyle=C.marca;
  [260,820].forEach(x=>{ g.beginPath(); g.arc(x,cyAnel,12,0,Math.PI*2); g.fill(); });

  // herói: senta em cima da linha
  let heroi, rotulo, sussurro='';
  if(_cardTipo==='constancia'){
    heroi=String(dd.st); rotulo=dd.st===1?'dia seguido':'dias seguidos';
    if(dd.rec>dd.st) sussurro='recorde: '+dd.rec;
    else if(dd.rec===dd.st&&dd.st>0) sussurro='meu melhor até hoje';
  } else if(_cardTipo==='semana'){
    heroi=String(dd.batidos); rotulo='de 7 dias no ritmo';
    if(dd.st>0) sussurro='constância: '+dd.st+(dd.st===1?' dia':' dias');
  } else {
    heroi=String(dd.tr); rotulo=dd.tr===1?'treino em 7 dias':'treinos em 7 dias';
    if(dd.st>0) sussurro='constância: '+dd.st+(dd.st===1?' dia':' dias');
  }

  g.fillStyle=C.tinta;
  if(_cardTipo==='constancia'&&dd.st===0){
    // o card mais importante do app: zerar não é veredito
    desenhaHeroi(g,'recomeçar',cx,706,cyAnel,124,56);
    rotulo='constância inclui recomeçar';
  } else {
    const tam=heroi.length>=4?190:(heroi.length===3?236:(heroi.length===2?300:320));
    desenhaHeroi(g,heroi,cx,706,cyAnel,tam,120);
  }

  g.fillStyle=C.tinta2; g.font=fnt(_cardTipo==='constancia'&&dd.st===0?34:48,600);
  g.fillText(rotulo,cx,820);

  // chip da moldura (só no card de constância)
  if(_cardTipo==='constancia'){
    const txt='moldura '+String(dd.tier.nome||'').toLowerCase();
    g.font=fnt(32,700);
    const larg=g.measureText(txt).width+56, alt=58, x0=cx-larg/2, y0=892-alt/2, r=29;
    g.beginPath();
    g.moveTo(x0+r,y0); g.lineTo(x0+larg-r,y0);
    g.quadraticCurveTo(x0+larg,y0,x0+larg,y0+r);
    g.lineTo(x0+larg,y0+alt-r);
    g.quadraticCurveTo(x0+larg,y0+alt,x0+larg-r,y0+alt);
    g.lineTo(x0+r,y0+alt);
    g.quadraticCurveTo(x0,y0+alt,x0,y0+alt-r);
    g.lineTo(x0,y0+r);
    g.quadraticCurveTo(x0,y0,x0+r,y0);
    g.closePath();
    g.fillStyle=C.chipFundo; g.fill();
    g.lineWidth=1.5; g.strokeStyle=t.cor+'66'; g.stroke();
    g.fillStyle=t.cor; g.fillText(txt,cx,892+11);
  }

  if(sussurro){ g.fillStyle=C.apagado; g.font=fnt(30,500); g.fillText(sussurro,cx,968); }

  // ---- a semana: chão de 7 colunas, eco da linha do logo ----
  const base=1360;
  g.lineWidth=2; g.strokeStyle=C.trilho; g.lineCap='round';
  g.beginPath(); g.moveTo(150,base+2); g.lineTo(930,base+2); g.stroke();
  g.lineCap='butt';
  const maxXp=Math.max(1,...dd.dias.map(x=>x.xp));
  dd.dias.forEach((x,i)=>{
    const colX=240+i*100;
    let alt;
    if(_cardTipo==='treino') alt=x.neutro?100:(x.treino?130:26);
    else alt=26+Math.round(142*x.xp/maxXp);
    if(x.neutro) alt=Math.max(alt,72);
    barraArredondada(g,colX,base,58,alt,14);
    if(x.neutro){
      g.fillStyle=C.neutroFundo; g.fill();
      g.lineWidth=2; g.strokeStyle=C.linha; g.stroke();
    } else {
      const cheio=(_cardTipo==='treino')?x.treino:x.bateu;
      g.fillStyle=cheio?C.marca:C.vazio; g.fill();
    }
  });
  // um ponto marcando hoje — em vez de sete letras
  g.fillStyle=C.apagado;
  g.beginPath(); g.arc(840,base+32,5,0,Math.PI*2); g.fill();

  // ---- rodapé em posições fixas ----
  if(_cardNome&&dd.nome){
    g.fillStyle=C.tinta2; g.font=fnt(40,600);
    g.fillText(dd.nome,cx,1478);
  }
  assinatura(g,cx,1544,56);
  g.fillStyle=C.apagado; g.font=fnt(26,500);
  textoEspacado(g,'sem picos, sempre constante',cx,1592,0.3);
}

function gerarCardBlob(){
  return new Promise(resolve=>{
    const cv=document.createElement('canvas');
    cv.width=1080; cv.height=1920;
    desenharCard(cv,dadosCard());
    cv.toBlob(b=>resolve(b),'image/png');   // fundo chapado comprime bem e o texto não borra
  });
}

function abrirCompartilhar(){
  const cv=document.createElement('canvas');
  cv.width=1080; cv.height=1920;
  desenharCard(cv,dadosCard());
  const prev=cv.toDataURL('image/png');

  const abas=Object.keys(CARDS_COMPARTILHA).map(k=>
    '<button class="btn mini '+(k===_cardTipo?'':'sec-btn')+'" data-action="card-tipo" data-t="'+k+'">'
    +esc(CARDS_COMPARTILHA[k].nome)+'</button>').join('');

  abrirModal('<h3>Compartilhar</h3>'
    +'<div class="acoes" style="display:flex;gap:0.4rem;flex-wrap:wrap;margin-bottom:0.6rem">'+abas+'</div>'
    +'<img src="'+prev+'" alt="Prévia do card" style="width:100%;max-height:44vh;object-fit:contain;border-radius:var(--radius-sm);background:#0d0d0d">'
    +'<label class="linha mt small sec"><input type="checkbox" style="width:auto" data-action="card-nome" '+(_cardNome?'checked':'')+'> mostrar meu nome</label>'
    +'<p class="muted small">Vai só a tua constância, a moldura e os treinos. Peso, dinheiro, humor, remédios e apostas <b>nunca</b> entram — nem se você quiser. E não vai link nenhum: quem quiser saber, pergunta 🙂</p>'
    +'<div class="acoes mt" style="display:flex;gap:0.5rem;flex-wrap:wrap">'
    +'<button class="btn sec-btn" data-action="fechar-modal">Fechar</button>'
    +'<button class="btn" data-action="card-enviar">Compartilhar ▸</button>'
    +'</div>');
}

async function enviarCard(){
  const blob=await gerarCardBlob();
  if(!blob){ toast('Não consegui gerar a imagem'); return; }
  const arq=new File([blob],'constante.png',{type:'image/png'});
  // sem texto e sem link: o card é a mensagem inteira
  if(navigator.canShare&&navigator.canShare({files:[arq]})&&navigator.share){
    try{
      await navigator.share({files:[arq]});
      if(typeof metrica==='function') metrica('card-compartilhado',{tipo:_cardTipo});
      return;
    }catch(e){ if(e&&e.name==='AbortError') return; }
  }
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download='constante.png';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url),4000);
  toast('📥 Imagem salva — é só postar');
  if(typeof metrica==='function') metrica('card-baixado',{tipo:_cardTipo});
}
