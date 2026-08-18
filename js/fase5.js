'use strict';
// ============================================================
// FASE 5 — o sistema calmo
//   1) barra de baixo personalizável (Hoje fixo + 4 à escolha)
//   2) projetos financeiros (gasto por objetivo)
//   3) revisão da semana (domingo)
//   4) avisos que ajudam (lembretes gerados da rotina)
// Regra de marca que vale pra tudo aqui: retrato, nunca boletim.
// Nada nesta tela cobra, pontua ou compara a pessoa com ninguém.
// ============================================================

// ------------------------------------------------------------
// 1) BARRA DE BAIXO
// ------------------------------------------------------------
function renderNav(){
  const nav=document.getElementById('bottom-nav');
  if(!nav||typeof barraAtual!=='function') return;
  const ids=barraAtual();
  const fora=abasForaDaBarra();
  let h='';
  ids.forEach(id=>{
    const a=abaPorId(id); if(!a) return;
    h+='<button data-nav="'+esc(a.id)+'"'+(a.id===UI.tab?' class="ativo"':'')
      +' aria-label="'+esc(a.nome)+'"><span class="ic">'+a.icone+'</span>'+esc(a.nome)+'</button>';
  });
  if(fora.length){
    const ativo=fora.some(a=>a.id===UI.tab);
    h+='<button data-action="barra-mais"'+(ativo?' class="ativo"':'')
      +' aria-label="Mais abas"><span class="ic">⋯</span>Mais</button>';
  }
  nav.innerHTML=h;
}

// Folha "Mais": o que não coube na barra continua a um toque de distância.
function abrirMaisAbas(){
  const fora=abasForaDaBarra();
  if(!fora.length){ abrirBarraConfig(); return; }
  abrirModal('<h3>Mais</h3>'
    +'<div class="abas-mais">'
    +fora.map(a=>'<button class="aba-op" data-action="barra-ir" data-id="'+esc(a.id)+'">'
      +'<span class="ic">'+a.icone+'</span><span>'+esc(a.nome)+'</span></button>').join('')
    +'</div>'
    +'<p class="muted small mt">Quer alguma delas fixa na barra de baixo? Dá pra escolher — ou segurar o dedo na barra por um segundo.</p>'
    +'<div class="acoes"><button class="btn sec-btn" data-action="fechar-modal">Fechar</button>'
    +'<button class="btn" data-action="barra-config">Personalizar barra</button></div>');
}

// A ordem em que a pessoa toca é a ordem que aparece na barra — sem arrastar nada.
let _barraTmp=null;
function abrirBarraConfig(){
  if(!_barraTmp) _barraTmp=barraAtual().filter(id=>id!=='hoje');
  const livres=BARRA_MAX-1-_barraTmp.length;
  const opcoes=ABAS.filter(a=>!a.fixa).map(a=>{
    const pos=_barraTmp.indexOf(a.id);
    const sel=pos>=0;
    const cheio=(!sel&&livres<=0);
    return '<button class="aba-op'+(sel?' sel':'')+(cheio?' cheia':'')+'" data-action="barra-toggle" data-id="'+esc(a.id)+'">'
      +'<span class="ic">'+a.icone+'</span><span>'+esc(a.nome)+'</span>'
      +'<span class="pos">'+(sel?(pos+1)+'ª':'')+'</span></button>';
  }).join('');
  abrirModal('<h3>Barra de baixo</h3>'
    +'<p class="sec small"><b>☀️ Hoje</b> fica sempre no lugar. Escolha até <b>4</b> abas pra ficarem ao lado dela — '
    +'a ordem é a ordem em que você tocar. O que ficar de fora vai pro botão <b>⋯ Mais</b>, então nada some.</p>'
    +'<div class="abas-mais mt">'+opcoes+'</div>'
    +'<p class="muted small mt">'+(livres>0?('Ainda cabem '+livres+'.'):'Barra cheia — toque numa marcada pra tirar.')+'</p>'
    +'<div class="acoes"><button class="btn sec-btn" data-action="barra-sugerida">Deixa o app escolher</button>'
    +'<button class="btn" data-action="barra-salvar">Salvar</button></div>');
}

function secaoBarra(){
  const ids=barraAtual();
  return '<section class="card"><h2>Barra de baixo</h2>'
    +'<p class="muted small">Escolha quais abas ficam à mão. Atalho: segure o dedo na própria barra por um segundo. Vale só neste aparelho — no celular e no note você pode ter barras diferentes.</p>'
    +'<div class="linha mt" style="gap:0.35rem;flex-wrap:wrap">'
    +ids.map(id=>{ const a=abaPorId(id); return a?('<span class="chip">'+a.icone+' '+esc(a.nome)+'</span>'):''; }).join('')
    +(abasForaDaBarra().length?'<span class="chip">⋯ Mais</span>':'')
    +'</div>'
    +'<button class="btn sec-btn mt" data-action="barra-config">Escolher abas</button></section>';
}

// ------------------------------------------------------------
// 2) PROJETOS FINANCEIROS
// ------------------------------------------------------------
// Etiqueta do projeto ao lado do lançamento — só quando o projeto existe.
function chipProjeto(g){
  const p=g&&g.proj?projPorId(g.proj):null;
  return p?(' <span class="chip-proj">'+esc(p.icone)+' '+esc(p.nome)+'</span>'):'';
}
// <option>s do seletor de projeto (usado no modal de registrar gasto).
function opcoesProjeto(sel){
  return '<option value="">— nenhum —</option>'
    +projetosAtivos().map(p=>'<option value="'+esc(p.id)+'"'+(sel===p.id?' selected':'')+'>'
      +esc(p.icone+' '+p.nome)+'</option>').join('');
}

function secaoProjetos(){
  const ps=projetosAtivos();
  if(!ps.length){
    return '<section class="card"><h2>Projetos <span class="chip">opcional</span></h2>'
      +'<p class="muted small">Juntando dinheiro pra alguma coisa — viagem, casamento, reforma, faculdade? '
      +'Um <b>projeto</b> agrupa os gastos por objetivo.</p>'
      +'<p class="muted small mt">A diferença: <b>categoria</b> é com o QUE você gastou (Materiais). '
      +'<b>Projeto</b> é pra QUAL objetivo aquele gasto foi (Reforma do apto). O mesmo gasto pode ter os dois.</p>'
      +'<button class="btn sec-btn mt" data-action="proj-add">+ Criar projeto</button></section>';
  }
  let html='<section class="card"><h2>Projetos <button class="btn mini sec-btn dir" data-action="proj-add">+ Novo</button></h2>';
  ps.forEach(p=>{
    const lista=gastosDoProjeto(p.id).slice().sort((a,b)=>a.data<b.data?1:(a.data>b.data?-1:(a.id<b.id?1:-1)));
    const tot=totalProjeto(p.id);
    const temAlvo=Number(p.alvo)>0;
    const pct=temAlvo?Math.min(100,Math.round(100*tot/p.alvo)):0;
    html+='<div class="proj-item">'
      +'<div class="linha"><span style="width:1.5rem;text-align:center">'+esc(p.icone)+'</span>'
      +'<span class="esq"><b>'+esc(p.nome)+'</b>'
      +'<div class="muted small">'+lista.length+(lista.length===1?' lançamento':' lançamentos')+'</div></span>'
      +'<span class="num">'+$$(tot)+'</span>'
      +'<button class="edit" data-action="proj-edit" data-id="'+esc(p.id)+'" aria-label="Editar projeto">✎</button></div>';
    if(temAlvo){
      html+='<div class="progress fina mt"><span style="width:'+pct+'%"></span></div>'
        +'<div class="muted small">'+$$(tot)+' de '+$$(p.alvo)+' previstos'
        +(tot>p.alvo?' — passou do previsto. É o retrato, não uma cobrança.':'')+'</div>';
    }
    if(lista.length){
      html+='<details class="mt"><summary class="muted small">Ver o extrato deste projeto</summary>';
      let diaG=null;
      lista.forEach(g=>{
        if(g.data!==diaG){ diaG=g.data; html+='<div class="grupo-titulo">'+fmtData(diaG)+'</div>'; }
        const c=catGasto(g.cat);
        html+='<div class="linha" style="padding:0.3rem 0;border-bottom:1px solid var(--grid)">'
          +'<span style="width:1.4rem;text-align:center">'+esc(c.icone)+'</span>'
          +'<span class="esq small">'+esc(g.desc||c.nome)+'</span>'
          +'<span class="num small">'+$$(g.valor)+'</span></div>';
      });
      html+='</details>';
    } else {
      html+='<p class="muted small mt">Nenhum gasto marcado neste projeto ainda — o seletor "Projeto" aparece na hora de registrar.</p>';
    }
    // quem cria o projeto DEPOIS de já ter lançado precisa de um jeito de etiquetar o passado
    if(gastosSemProjeto().length){
      html+='<button class="btn mini sec-btn mt" data-action="proj-marcar" data-id="'+esc(p.id)+'">Marcar gastos que já lancei</button>';
    }
    html+='</div>';
  });
  html+='<p class="muted small mt">Projeto é uma etiqueta a mais no gasto: ele continua contando normal no total do mês.</p>';
  return html+'</section>';
}

function abrirModalProjeto(id){
  const p=id?projPorId(id):null;
  const modelos=MODELOS_PROJETO.map(m=>'<button class="chip-onb" data-action="proj-modelo" data-i="'+esc(m.icone)+'" data-n="'+esc(m.nome)+'">'
    +m.icone+(m.nome?' '+esc(m.nome):' Do zero')+'</button>').join('');
  abrirModal('<h3>'+(p?'Editar projeto':'Novo projeto')+'</h3>'
    +(p?'':'<p class="muted small">Comece por um modelo ou escreva o seu:</p><div class="chips-onb">'+modelos+'</div>')
    +'<div class="grid-2">'+campo('pj-icone','Ícone (emoji)','text',p?p.icone:'🎯')
    +campo('pj-nome','Nome do objetivo','text',p?p.nome:'')+'</div>'
    +campo('pj-alvo','Quanto você espera gastar no total (opcional)','number',(p&&p.alvo)?p.alvo:'')
    +'<p class="muted small">Isso é só uma referência pra você se situar — o app não vai te cobrar por causa dela.</p>'
    +'<div class="acoes"><button class="btn sec-btn" data-action="fechar-modal">Cancelar</button>'
    +'<button class="btn" data-action="proj-salvar" data-id="'+esc(id||'')+'">Salvar</button></div>'
    +(p?'<p class="centro mt"><button class="deslize-btn" data-action="proj-del" data-id="'+esc(p.id)+'">Apagar este projeto</button></p>':''));
}

// Etiquetar em lote o que já foi lançado antes de o projeto existir.
let _projMarcar=[];
function abrirMarcarGastos(idProj){
  const p=projPorId(idProj); if(!p) return;
  const livres=gastosSemProjeto().slice(0,60);
  if(!livres.length){
    abrirModal('<h3>Nada pra marcar</h3><p class="sec small">Todos os gastos dos últimos meses já estão num projeto.</p>'
      +'<div class="acoes"><button class="btn" data-action="fechar-modal">Fechar</button></div>');
    return;
  }
  abrirModal('<h3>'+esc(p.icone)+' '+esc(p.nome)+'</h3>'
    +'<p class="sec small">Toque nos gastos que foram pra esse objetivo. Eles continuam na categoria que já têm — só ganham a etiqueta.</p>'
    +'<div class="chips-onb" style="max-height:46vh;overflow:auto">'
    +livres.map(g=>{
      const c=catGasto(g.cat);
      return '<button class="chip-onb'+(_projMarcar.indexOf(g.id)>=0?' sel':'')+'" data-action="proj-marcar-item" data-id="'+esc(g.id)+'">'
        +esc(c.icone)+' '+esc(g.desc||c.nome)+' · '+fmtData(g.data)+' · '+fmtBRL(g.valor)+'</button>';
    }).join('')
    +'</div>'
    +'<div class="acoes"><button class="btn sec-btn" data-action="fechar-modal">Cancelar</button>'
    +'<button class="btn" data-action="proj-marcar-ok" data-id="'+esc(idProj)+'">Marcar ('+_projMarcar.length+')</button></div>');
}

// ------------------------------------------------------------
// v53: ÁGUA DO JEITO DE CADA UM
// ------------------------------------------------------------
let _aguaUltimo=0;   // último volume somado nesta sessão (pro botão de desfazer)
const AGUA_PRESETS=[200,250,300,330,473,500,600,750,1000];

function abrirModalAgua(){
  const recs=aguaRecipientes();
  const un=aguaUnidade();
  abrirModal('<h3>💧 Como você bebe</h3>'
    +'<p class="sec small">Cada um desses vira um botão na tela Hoje. Copo, garrafa, garrafinha de 473 — do tamanho que for o seu.</p>'
    +'<div class="lista-edit">'
    +recs.map(r=>'<div class="item-edit"><span>'+esc(r.icone)+'</span>'
      +'<span class="nome">'+esc(r.nome)+' <span class="muted small">'+r.ml+' ml</span></span>'
      +'<button class="btn mini perigo" data-action="agua-rec-del" data-id="'+esc(r.id||'')+'" aria-label="Apagar '+esc(r.nome)+'">✕</button></div>').join('')
    +'</div>'
    +(recs.length<AGUA_MAX_REC
      ? '<div class="grupo-titulo">Adicionar</div>'
        +'<div class="chips-onb">'+AGUA_PRESETS.map(m=>'<button class="chip-onb" data-action="agua-preset" data-ml="'+m+'">'+m+' ml</button>').join('')+'</div>'
        +'<div class="grid-2">'+campo('ag-novo-icone','Ícone','text','💧')+campo('ag-novo-nome','Nome (ex.: Garrafinha)','text','')+'</div>'
        +campo('ag-novo-ml','Tamanho em ml','number','')
        +'<button class="btn sec-btn bloco" data-action="agua-rec-add">+ Adicionar</button>'
      : '<p class="muted small mt">Cabem '+AGUA_MAX_REC+' botões. Apaga um pra pôr outro.</p>')
    +'<div class="grupo-titulo">Mostrar o total em</div>'
    +'<div class="linha" style="gap:0.4rem">'
    +'<button class="btn mini '+(un==='L'?'':'sec-btn')+'" data-action="agua-unidade" data-u="L">Litros</button>'
    +'<button class="btn mini '+(un==='ml'?'':'sec-btn')+'" data-action="agua-unidade" data-u="ml">Mililitros</button>'
    +'</div>'
    +'<p class="muted small mt">O app sempre guarda em ml por dentro, então mudar isso não mexe na sua meta nem no que você já registrou.</p>'
    +'<div class="acoes"><button class="btn" data-action="agua-fechar">Pronto</button></div>');
}

// ------------------------------------------------------------
// 3) REVISÃO DA SEMANA
// ------------------------------------------------------------
function cardRevisaoHoje(){
  if(!semanaFechada()) return '';
  const sem=inicioSemana();
  if((S.settings.revisaoVista||'')===sem) return '';
  return '<section class="card" style="border-left:3px solid var(--brand)">'
    +'<div class="linha"><div class="esq"><b>📊 A semana fechou</b>'
    +'<div class="muted small">Quer ver o retrato dos seus 7 dias? Leva um minuto.</div></div>'
    +'<button class="btn mini" data-action="revisao-abrir">Ver</button></div>'
    +'<p class="centro mt"><button class="deslize-btn" data-action="revisao-depois">agora não</button></p></section>';
}

function viewRevisao(){
  const r=resumoSemana();
  const periodo=fmtData(r.ini)+' a '+fmtData(r.fim);
  const bem=r.habitos.filter(x=>x.pct!==null&&x.pct>=60).sort((a,b)=>b.pct-a.pct);
  const atras=r.habitos.filter(x=>x.pct!==null&&x.pct<60).sort((a,b)=>a.pct-b.pct);

  let html='<section class="card">'
    +'<button class="btn mini sec-btn" data-action="revisao-fechar">‹ Voltar</button>'
    +'<h2 class="mt">📊 Sua semana</h2>'
    +'<p class="muted small">'+esc(periodo)+(r.fechada?'':' — semana ainda em andamento')+'</p>'
    +'<div class="linha mt"><div class="esq"><span class="hero-num num">'+r.contaram+'</span>'
    +'<div class="hero-sub">de '+r.dias.length+' dia'+(r.dias.length===1?'':'s')+' contaram</div></div>'
    +'<div style="text-align:right"><b class="num">'+r.streak+'</b><div class="hero-sub">dias de linha</div></div></div>'
    +(r.neutros?'<p class="muted small mt">🌙 '+r.neutros+' dia'+(r.neutros>1?'s marcados':' marcado')+' como difícil — não conta como falha.</p>':'')
    +'<p class="muted small mt">Isto é um retrato da semana, não uma nota. Serve pra você decidir o que vem agora.</p>'
    +'</section>';

  if(r.habitos.length){
    html+='<section class="card"><h2>Hábito por hábito</h2>';
    if(bem.length){
      html+='<div class="grupo-titulo">Andou bem</div>';
      bem.forEach(x=>{ html+=linhaHabitoSemana(x); });
    }
    if(atras.length){
      html+='<div class="grupo-titulo">Andou menos</div>';
      atras.forEach(x=>{ html+=linhaHabitoSemana(x); });
      html+='<p class="muted small mt">Sem cobrança: se quiser, escolhe <b>um</b> desses pra semana que vem. Um só.</p>';
    }
    html+='</section>';
  }

  html+='<section class="card"><h2>O resto da semana</h2><div class="cfg-grid">'
    +'<div><div class="hero-sub">Treinos</div><b class="num">'+r.treinos+'</b></div>'
    +'<div><div class="hero-sub">XP somado</div><b class="num">'+r.xp+'</b></div>'
    +(r.sonoMedia!=null
      ? '<div><div class="hero-sub">Sono (média de '+r.sonoDias+' noite'+(r.sonoDias>1?'s':'')+')</div><b class="num">'+fmtQtd(r.sonoMedia)+' h</b></div>'
      : '<div><div class="hero-sub">Sono</div><span class="muted small">sem registro</span></div>')
    +'<div><div class="hero-sub">Gasto na semana</div><b class="num">'+$$(r.gasto)+'</b></div>'
    +'</div>'
    +(r.topCat?'<p class="muted small mt">Onde mais saiu: '+esc(r.topCat.cat.icone+' '+r.topCat.cat.nome)+' — '+$$(r.topCat.total)+' em '+r.lancs+' lançamento'+(r.lancs===1?'':'s')+'.':'')
    +'</section>';

  html+='<section class="card"><h2>E agora?</h2>'
    +'<p class="sec small">A semana que vem não precisa ser maior. Precisa ser possível.</p>'
    +'<div class="acoes mt" style="display:flex;gap:0.5rem;flex-wrap:wrap">'
    +'<button class="btn" data-action="revisao-rotina">Ajustar minha rotina</button>'
    +'<button class="btn sec-btn" data-action="revisao-fechar">Fechar</button>'
    +'</div></section>';
  return html;
}

function linhaHabitoSemana(x){
  const pct=x.pct||0;
  return '<div class="linha" style="padding:0.35rem 0;gap:0.5rem">'
    +'<span style="width:1.5rem;text-align:center">'+esc(x.h.icone||'⭐')+'</span>'
    +'<span class="esq small">'+esc(x.h.nome)+'</span>'
    +'<span class="progress" style="flex:1;max-width:7rem"><span style="width:'+pct+'%"></span></span>'
    +'<span class="num small" style="width:3.2rem;text-align:right">'+x.feitos+'/'+x.previstos+'</span></div>';
}

// ------------------------------------------------------------
// 4) AVISOS QUE AJUDAM
// ------------------------------------------------------------
function secaoAvisos(){
  if(typeof produtoAtivo!=='function'||!produtoAtivo()) return '';
  const a=cfgAvisos();
  const props=(typeof avisosDaRotina==='function')?avisosDaRotina():[];
  const calados=props.filter(x=>x.calado).length;
  const pausado=lembretesPausados();

  let html='<section class="card" id="sec-avisos"><h2>Avisos que ajudam</h2>'
    +'<p class="muted small">Aviso bom é o que chega na hora do que você já planejou — e cala a boca no resto do tempo.</p>';

  if(!props.length){
    html+='<p class="muted small mt">Sua rotina ainda não tem blocos com horário. Monte a rotina e o app cria os avisos dela pra você de uma vez.</p>'
      +'<button class="btn sec-btn mt" data-nav="rotina">Montar minha rotina</button>';
  } else {
    html+='<div class="linha mt"><span class="esq small sec">Avisar</span>'
      +'<select data-avisos="antecedencia" aria-label="Quando avisar">'
      +[[0,'na hora do bloco'],[10,'10 min antes'],[30,'30 min antes']]
        .map(o=>'<option value="'+o[0]+'"'+(Number(a.antecedencia)===o[0]?' selected':'')+'>'+o[1]+'</option>').join('')
      +'</select></div>'
      +'<div class="linha mt"><span class="esq small sec">Silêncio (não cria aviso aqui dentro)</span></div>'
      +'<div class="linha"><input type="time" data-avisos="silencioDe" value="'+esc(a.silencioDe)+'" aria-label="Silêncio a partir de">'
      +'<span class="muted small">até</span>'
      +'<input type="time" data-avisos="silencioAte" value="'+esc(a.silencioAte)+'" aria-label="Silêncio até"></div>'
      +'<p class="muted small mt">'+props.length+' bloco'+(props.length===1?'':'s')+' da tua rotina pode'+(props.length===1?'':'m')+' virar aviso'
      +(calados?' — '+calados+' cai'+(calados===1?'':'em')+' no silêncio e fica'+(calados===1?'':'m')+' de fora.':'.')+'</p>'
      +'<button class="btn mt" data-action="avisos-criar">Criar os avisos da minha rotina</button>'
      +'<details class="mt"><summary class="muted small">Ver o que seria criado</summary>'
      +props.map(x=>'<div class="linha small" style="padding:0.25rem 0;border-bottom:1px solid var(--grid)'+(x.calado?';opacity:0.5':'')+'">'
        +'<span class="num" style="width:3.2rem">'+esc(x.hora)+'</span>'
        +'<span class="esq">'+esc(textoAviso(x))+'</span>'
        +'<span class="muted">'+(x.calado?'🌙 silêncio':(x.dias.length===7?'todo dia':x.dias.map(d=>DIAS_ABREV[d]).join(',')))+'</span></div>').join('')
      +'</details>';
  }

  html+='<div class="acoes mt" style="display:flex;gap:0.5rem;flex-wrap:wrap">'
    +'<button class="btn sec-btn" data-action="avisos-pausar">'+(pausado?'Religar todos os avisos':'Pausar todos os avisos')+'</button>'
    +'</div>'
    +(pausado?'<div class="ok-box mt">🔕 Todos os teus avisos estão pausados. Nada vai te incomodar até você religar.</div>':'')
    +'<p class="muted small mt">Nenhum aviso daqui cobra nada de você: é convite, não cobrança. Dá pra editar ou apagar um por um logo abaixo — e aviso que você editar na mão vira seu: refazer os da rotina não mexe mais nele. O silêncio e a antecedência valem só neste aparelho.</p>';
  return html+'</section>';
}
