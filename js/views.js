'use strict';

const UI={ tab:'hoje', rotinaDia:new Date().getDay(), sub:null, granaMes:null, granaDia:null };

const TIPO_LABEL={aula:'Aula',estagio:'Estágio',treino:'Treino',refeicao:'Refeição',estudo:'Estudo',
  sites:'Sites',idioma:'Idiomas',leitura:'Leitura',sono:'Sono',livre:'Livre',pausa:'Pausa',
  desloc:'Deslocamento',remedios:'Remédios',revisao:'Revisão'};

let _tabAnterior=null;
function render(){
  recalcXP(hojeISO());
  const novas=checarConquistas();
  const view=document.getElementById('view');

  let html;
  if(UI.sub&&UI.sub.tipo==='treino') html=viewTreinoDetalhe(UI.sub.id);
  else if(UI.sub&&UI.sub.tipo==='caderno') html=viewCadernoDetalhe(UI.sub.id);
  else if(UI.sub&&UI.sub.tipo==='progresso') html=viewProgresso();
  else {
    UI.sub=null;
    const fn={hoje:viewHoje,rotina:viewRotina,dieta:viewDieta,grana:viewGrana,mente:viewMente,progresso:viewProgressoTab,config:viewConfig}[UI.tab]||viewHoje;
    html=fn();
  }
  view.innerHTML=html;
  if(UI.tab!==_tabAnterior){ _tabAnterior=UI.tab; view.classList.remove('anim'); void view.offsetWidth; view.classList.add('anim'); }
  renderTopbar();
  if(UI.sub&&UI.sub.tipo==='progresso') hidratarFotos();
  document.querySelectorAll('.bottom-nav button').forEach(b=>{
    b.classList.toggle('ativo',b.dataset.nav===UI.tab);
  });
  const recAtual=melhorStreak();
  if(S.gamif && recAtual>(S.gamif.recordeVisto||0)){
    const recAntes=S.gamif.recordeVisto||0;
    S.gamif.recordeVisto=recAtual;
    saveState({skipSync:true});
    if(recAntes>0) toast('🏆 Novo recorde pessoal: '+recAtual+' dia'+(recAtual===1?'':'s')+' de constância!');
  }
  const _onbR=(typeof onbEstado==='function')?onbEstado():null;
  if(_onbR&&_onbR.vitoria==='pendente'&&(S.days[hojeISO()]&&(S.days[hojeISO()].xp||0)>0)){
    _onbR.vitoria='feita';
    saveState({skipSync:true});
    toast('🎉 Primeira vitória! É assim mesmo: uma coisa por vez, todo dia.');
    if(typeof metrica==='function') metrica('primeira-vitoria');
  }
  if(novas.length===1){
    toast('🏆 '+novas[0].icone+' '+esc(novas[0].nome));
  } else if(novas.length>1){
    toast('🏆 '+novas.length+' novas conquistas! Confira na aba Mente.');
  }
}

function pillSync(){
  if(typeof syncEstado!=='function') return '';
  const s=syncEstado();
  if(s==='local') return '';
  const M={
    ok:['☁️','Salvo na nuvem',''],
    pendente:['☁️ …','Mudança recente — enviando em instantes',''],
    sincronizando:['☁️ …','Sincronizando…',''],
    offline:['✈️','Sem conexão — teus registros estão salvos no aparelho','warn'],
    erro:['☁️ !','Problema pra sincronizar — toca pra ver','warn']
  }[s]||['☁️','',''];
  return '<button class="pill '+M[2]+'" data-action="sync-status" aria-label="Nuvem: '+esc(M[1])+'" title="'+esc(M[1])+'">'+M[0]+'</button>';
}

function renderTopbar(){
  const st=streakGeral();
  const nv=nivelAtual();
  document.getElementById('top-stats').innerHTML=
    pillSync()
    +(st>0?'<span class="pill" title="Constância: dias seguidos com o dia batido">🔥 <span class="num">'+st+'</span></span>':'<span class="pill" title="Novo começo — cada dia somado conta">🌱</span>')
    +'<span class="pill" title="'+esc(nv.nome)+' — '+nv.xp+' XP">'+nv.icone+' <span class="num">'+nv.xp+'</span> XP</span>';
  const ba=document.getElementById('btn-assist');
  if(ba) ba.style.display=assistenteDisponivel()?'':'none';
}

function viewHoje(){
  const iso=hojeISO();
  const d=getDia(iso);
  const sauda=saudacaoHora();
  const frase=FRASES[((diffDias('2026-01-01',iso)%FRASES.length)+FRASES.length)%FRASES.length];
  const {atual,prox}=blocoAtual();
  const xpHoje=recalcXP(iso), xpPoss=xpPossivel(iso);
  const nv=nivelAtual();

  const nome=(S.profile.nome||'').trim();
  const foto=S.profile&&S.profile.foto;
  const tierAv=molduraTier();
  let html='<section class="card saudacao">'
    +'<div style="display:flex;align-items:center;gap:0.7rem">'
    +'<button class="avatar-anel anel-'+tierAv.id+' av-52" data-action="moldura-info" aria-label="Tua moldura: '+esc(tierAv.nome)+' — toca pra ver" title="Moldura '+esc(tierAv.nome)+'">'
    +(foto?'<img src="'+esc(foto)+'" alt="foto de perfil">':'<span class="avatar-inicial">'+(nome?esc(nome.charAt(0).toUpperCase()):'🙂')+'</span>')
    +'</button>'
    +'<div><h1 style="margin:0">'+sauda+(nome?', '+esc(nome):'')+' 👋</h1>'
    +'<div class="muted">'+fmtDataLonga(iso)+'</div></div></div>'
    +'<div class="frase">“'+esc(frase)+'”</div>';
  if(atual) html+='<div class="agora"><b>Agora:</b> '+esc(atual.t)+' <span class="muted num">('+esc(atual.i)+(atual.f?'–'+esc(atual.f):'')+')</span></div>';
  if(prox) html+='<div class="agora" style="border-color:var(--baseline)"><b>Depois:</b> '+esc(prox.t)+' <span class="muted num">('+esc(prox.i)+')</span></div>';
  html+='</section>';

  if(UI.recomecoLeve){
    html+='<section class="card" style="border-left:3px solid var(--good)"><h2>🌱 Bom te ver de novo</h2>'
      +'<p class="sec small">Ficar uns dias fora acontece — recomeçar também é constância. Começa leve: marca UMA coisa hoje (uma água já conta).</p>'
      +'<div class="acoes mt"><button class="btn mini" data-action="recomeco-ok">Bora 🌱</button></div></section>';
  }

  if(typeof ehVisitante==='function'&&ehVisitante()){
    html+='<section class="card" style="border-left:3px solid var(--brand)"><h2>🔓 Você tá sem conta</h2>'
      +'<p class="sec small">Pode usar tudo assim. Só que os dados ficam <b>só neste aparelho</b> — se limpar o navegador, somem. Criando conta, eles salvam na nuvem e aparecem no celular também (e o que você já anotou vai junto).</p>'
      +'<div class="acoes mt" style="display:flex;gap:0.5rem;flex-wrap:wrap">'
      +'<button class="btn" data-action="visitante-criar-conta">Criar conta e salvar</button>'
      +'<button class="btn sec-btn" data-action="visitante-ja-tenho">Já tenho conta</button>'
      +'</div></section>';
  }

  const onbV=(typeof onbEstado==='function')?onbEstado():null;
  if(onbV&&onbV.vitoria==='pendente'&&xpHoje===0){
    html+='<section class="card" style="border-left:3px solid var(--good)"><h2>🎯 Tua primeira vitória</h2>'
      +'<p class="sec small">Marca <b>uma</b> coisa que você já fez hoje — pode ser um copo de água. Não precisa ser um dia perfeito: precisa começar.</p></section>';
  }

  // Card de novidades: curto de propósito — no máx. 3 itens, o resto fica no histórico.
  const nvs=(typeof novidadesNaoVistas==='function')?novidadesNaoVistas():[];
  if(nvs.length){
    const itensNv=[]; nvs.forEach(n=>n.itens.forEach(it=>itensNv.push(it)));
    const mostraNv=itensNv.slice(0,3), restoNv=itensNv.length-mostraNv.length;
    html+='<section class="card" style="border-left:3px solid var(--brand)"><h2>✨ Novidades no Constante</h2>'
      +'<ul class="sec small" style="margin:0.3rem 0 0.5rem 1.1rem;padding:0">'
      +mostraNv.map(it=>'<li style="margin:0.3rem 0">'+esc(it)+'</li>').join('')+'</ul>'
      +(restoNv>0?'<p class="muted small">+ '+restoNv+' outras melhorias no histórico.</p>':'')
      +'<div class="acoes mt" style="display:flex;gap:0.5rem;flex-wrap:wrap">'
      +'<button class="btn mini" data-action="novidades-ok">Entendi</button>'
      +'<button class="btn mini sec-btn" data-action="novidades-todas">Ver histórico</button>'
      +'</div></section>';
  }


  const podeRepetir=(xpHoje===0)&&(typeof repetirOntem==='function')&&repetirOntem(true)>0;
  html+='<section class="card"><h2>Seu dia'
    +(podeRepetir?'<button class="btn mini sec-btn dir" data-action="repetir-ontem">↩️ Repetir ontem</button>':'')
    +'</h2>'
    +'<div class="linha"><div class="esq"><span class="hero-num num">'+xpHoje+'</span> <span class="muted">/ '+xpPoss+' XP</span></div>'
    +'<div>'+nv.icone+' <b>'+esc(nv.nome)+'</b>'+(nv.prox?' <span class="muted small">→ '+nv.prox.icone+' aos '+nv.prox.xp+'</span>':'')+'</div></div>'
    +'<div class="progress mt"><span style="width:'+Math.min(100,Math.round(100*xpHoje/Math.max(1,xpPoss)))+'%"></span></div>'
    +'<div class="muted small mt">Dia conta pra constância com '+Math.min(80,Math.round(xpPoss*0.5))+'+ XP.</div>'
    +barraSemana()
    +'</section>';

  if(!S.habits.length && !S.routine.length){
    html+='<section class="card" style="border-left:3px solid var(--brand)">'
      +'<h2>👋 Bem-vindo ao Constante</h2>'
      +'<p class="sec">Esse é seu espaço pra construir constância — hábitos, rotina, dieta, treino, finanças e cabeça, tudo num lugar só.</p>'
      +'<p class="sec small mt">Comece adicionando o que fizer sentido pra você:</p>'
      +'<div class="acoes mt" style="display:flex;gap:0.5rem;flex-wrap:wrap">'
      +(assistenteDisponivel()?'<button class="btn" data-action="assist-abrir">🤖 Montar com o assistente</button>':'')
      +'<button class="btn '+(assistenteDisponivel()?'sec-btn':'')+'" data-action="habito-add">+ Hábito</button>'
      +'<button class="btn sec-btn" data-nav="rotina">Montar minha rotina</button>'
      +'</div>'
      +(assistenteDisponivel()?'<p class="muted small mt">🤖 Manda uma foto do teu horário ou conta como é teu dia — eu monto pra você.</p>':'<p class="muted small mt">🤖 Em breve: um assistente que monta tudo a partir de uma foto do seu horário e do que você contar.</p>')
      +'</section>';
  }

  const habs=habitosDoDia(iso);
  const fazer=habs.filter(x=>x.tipo==='fazer');
  const evitar=habs.filter(x=>x.tipo==='evitar');
  html+='<section class="card"><h2>Hábitos de hoje <button class="btn mini sec-btn dir" data-action="habito-add">+ Hábito</button></h2>';
  if(!habs.length){
    html+='<p class="muted small">Nenhum hábito pra hoje. Toque em “+ Hábito” pra criar o primeiro.</p>';
  } else {
    fazer.forEach(hb=>{ html+=habRow(hb,d); });
    if(evitar.length){
      html+='<div class="grupo-titulo">Evitar hoje (marca no fim do dia se venceu)</div>';
      evitar.forEach(hb=>{ html+=habRow(hb,d); });
    }
  }
  html+='</section>';

  const treinoHoje=treinoDeHoje();
  html+='<section class="card"><h2>Treino</h2>'
    +'<button class="hab '+(d.treino?'feito':'')+'" data-action="treino-check" style="width:100%">'
    +'<span class="ic">🏋️</span>'
    +'<span class="nome">Treinei hoje<span class="sub">Vale qualquer um: academia, corrida, futevôlei, vôlei, cardio…</span></span>'
    +'<span class="check">✓</span></button>';
  const nTr=treinosNaSemana();
  if(nTr>0) html+='<p class="muted small mt">💪 '+nTr+' treino'+(nTr>1?'s':'')+' nos últimos 7 dias.</p>';
  if(treinoHoje){
    const temEx=treinoHoje.exercicios.length>0;
    html+='<button class="btn sec-btn bloco mt" data-action="abrir-treino" data-id="'+esc(treinoHoje.id)+'">'+esc(treinoHoje.nome)+(treinoHoje.foco?' — '+esc(treinoHoje.foco):'')+(temEx?' · registrar cargas ›':' · montar exercícios ›')+'</button>';
    if(treinoHoje.adiadoPara===iso){
      html+='<p class="muted small mt">⏭ Veio de '+(treinoHoje.diaSemana!=null?DIAS_NOME[treinoHoje.diaSemana]:'outro dia')
        +' — <button class="deslize-btn" data-action="treino-adiar-desfazer" data-id="'+esc(treinoHoje.id)+'">desfazer</button></p>';
    } else if(!d.treino){
      html+='<p class="muted small mt"><button class="deslize-btn" data-action="treino-adiar" data-id="'+esc(treinoHoje.id)+'">⏭ Não vai rolar hoje — empurrar pra amanhã</button></p>';
    }
  } else {
    const fugiu=(typeof treinoAdiadoDeHoje==='function')?treinoAdiadoDeHoje():null;
    if(fugiu){
      html+='<p class="muted small mt">⏭ '+esc(fugiu.nome)+' foi empurrado pra '+(fugiu.adiadoPara===addDias(iso,1)?'amanhã':fmtData(fugiu.adiadoPara))
        +' — <button class="deslize-btn" data-action="treino-adiar-desfazer" data-id="'+esc(fugiu.id)+'">trazer de volta</button></p>';
    }
  }
  html+='</section>';

  html+='<section class="card"><h2>Refeições <button class="btn mini sec-btn dir" data-action="ref-add">+ Refeição</button></h2>';
  if(!S.diet.refeicoes.length){
    html+='<p class="muted small">Sem refeições no plano ainda. Adicione uma ou monte tudo na aba Dieta.</p>';
  } else {
    S.diet.refeicoes.forEach(r=>{
      const ok=!!d.refeicoes[r.id];
      html+='<button class="item check-lista-item hab '+(ok?'feito':'')+'" data-action="ref" data-id="'+esc(r.id)+'">'
        +'<span class="nome">'+esc(r.nome)+'<span class="sub num">'+esc(r.hora)+' · ~'+r.kcal+' kcal</span></span>'
        +'<span class="check">✓</span></button>';
    });
  }
  html+='</section>';

  html+='<section class="card"><h2>Remédios & suplementos <button class="btn mini sec-btn dir" data-action="med-add">+ Remédio</button></h2><div class="check-lista">';
  if(!S.meds.grupos.length){
    html+='<p class="muted small">Nenhum remédio ou suplemento cadastrado. Toque em “+ Remédio” pra adicionar.</p>';
  } else {
    S.meds.grupos.forEach(g=>{
      const ok=!!d.meds[g.id];
      html+='<button class="item '+(ok?'ok':'')+'" data-action="med" data-id="'+esc(g.id)+'">'
        +'<span class="box">✓</span><span><b>'+esc(g.nome)+'</b><br><span class="muted small">'+esc((g.itens||[]).join(' · '))+'</span></span></button>';
    });
  }
  html+='</div>'+(S.meds.aviso?'<p class="muted small mt">'+esc(S.meds.aviso)+'</p>':'')+'</section>';

  const metaAgua=Number(S.profile.aguaAlvoMl)||0;
  const pctAgua=metaAgua>0?Math.min(100,Math.round(100*(d.agua||0)/metaAgua)):0;
  html+='<section class="card"><h2>Água</h2>'
    +'<div class="linha"><div class="esq"><span class="hero-num num">'+fmtQtd((d.agua||0)/1000)+'</span> <span class="muted">'+(metaAgua>0?'/ '+fmtQtd(metaAgua/1000)+' L':'L registrados hoje')+'</span></div>'
    +(metaAgua>0&&pctAgua>=100?'<span class="chip">💧 meta batida</span>':'')+'</div>'
    +(metaAgua>0?'<div class="progress azul mt"><span style="width:'+pctAgua+'%"></span></div>':'<p class="muted small mt"><button class="deslize-btn" data-action="meta-agua">Definir minha meta de água</button></p>')
    +'<div class="agua-controles mt"><button class="btn mini sec-btn" data-action="agua" data-ml="250">+250ml</button>'
    +'<button class="btn mini sec-btn" data-action="agua" data-ml="500">+500ml</button>'
    +'<button class="btn mini sec-btn" data-action="agua" data-ml="-250">−250ml</button></div></section>';

  const so=d.sono||{};
  html+='<section class="card"><h2>Sono (noite passada)</h2>'
    +'<div class="sono-form">'
    +'<div><label>Deitou (ontem)</label><input type="time" data-sono="deitou" value="'+esc(so.deitou||'')+'"></div>'
    +'<div><label>Acordou (hoje)</label><input type="time" data-sono="acordou" value="'+esc(so.acordou||'')+'"></div>'
    +'<div><label>Horas dormidas</label><input type="number" step="0.1" min="0" max="16" placeholder="ex.: 7,5" data-sono="h" value="'+esc(so.h!=null?so.h:'')+'"></div>'
    +'<div><label>Nota do sono (0–100)</label><input type="number" min="0" max="100" data-sono="score" value="'+esc(so.score!=null?so.score:'')+'"></div>'
    +'</div>'
    +'<div class="muted small mt">A nota do sono é opcional — preenche se teu relógio ou app dá uma nota de 0 a 100 (Garmin, Fitbit, Apple Watch, Samsung, Polar, Oura…). Não usa nenhum? Deixa em branco: as horas dormidas já bastam.</div>'
    +'<div class="muted small mt">Meta: deitar '+esc(S.settings.sono.deitar)+' · acordar '+esc(S.settings.sono.acordar)+(S.settings.sono.melatonina?' · melatonina '+esc(S.settings.sono.melatonina):'')+'.</div>'
    +'</section>';

  const EMO=['😞','😕','😐','🙂','😄'];
  html+='<section class="card"><h2>Check-in mental</h2>'
    +'<label class="muted small">Humor</label><div class="escala">'
    +EMO.map((e,i)=>'<button data-action="humor" data-v="'+(i+1)+'" class="'+(d.humor===i+1?'sel':'')+'" aria-label="Humor '+(i+1)+' de 5">'+e+'</button>').join('')
    +'</div><label class="muted small mt" style="display:block">Energia</label><div class="escala">'
    +[1,2,3,4,5].map(i=>'<button data-action="energia" data-v="'+i+'" class="'+(d.energia===i?'sel':'')+'" aria-label="Energia '+i+' de 5">'+'⚡'.repeat(i)+'</button>').join('')
    +'</div>'
    +'<div class="campo mt"><label>Nota do dia (opcional)</label><textarea rows="2" data-campo="nota" placeholder="Como foi o dia?">'+esc(d.nota||'')+'</textarea></div>'
    +'</section>';

  return html;
}

function habRow(hb,d){
  const v=d.habitos[hb.id];
  const st=streakHabito(hb.id);
  const classe=v===true?'feito':(v===false?'falhou':'');
  let sub='';
  if(hb.desc) sub='<span class="sub">'+esc(hb.desc)+'</span>';
  let extra='';
  if(hb.tipo==='evitar'&&v!==false){
    extra='<button class="deslize-btn" data-action="deslize" data-id="'+esc(hb.id)+'">Deslize?</button>';
  }
  return '<div class="linha"><button class="hab '+classe+' esq" data-action="habit" data-id="'+esc(hb.id)+'" style="flex:1">'
    +'<span class="ic">'+esc(hb.icone)+'</span>'
    +'<span class="nome">'+esc(hb.nome)+sub+'</span>'
    +'<span class="streak" title="dias seguidos">'+(st>0?'🔥'+st:'')+'</span>'
    +'<span class="check">'+(v===false?'✕':'✓')+'</span>'
    +'</button>'+extra+'</div>';
}

function barraSemana(){

  let html='<div class="mini-chart" role="img" aria-label="XP dos últimos 7 dias">';
  const hoje=hojeISO();
  let max=1;
  const dias=[];
  for(let i=6;i>=0;i--){
    const iso=addDias(hoje,-i);
    const xp=(S.days[iso]&&S.days[iso].xp)||0;
    max=Math.max(max,xp);
    dias.push({iso,xp});
  }
  dias.forEach((dd,ix)=>{
    const alt=Math.max(3,Math.round(56*dd.xp/max));
    const ehHoje=dd.iso===hoje;
    const mostraVal=ehHoje||dd.xp===max&&dd.xp>0;
    html+='<div class="col" title="'+fmtData(dd.iso)+': '+dd.xp+' XP">'
      +'<span class="val num">'+(mostraVal?dd.xp:'')+'</span>'
      +'<div class="bar '+(dd.xp===0?'apagada':'')+'" style="height:'+alt+'px'+(ehHoje?';background:var(--brand)':'')+'"></div>'
      +'<span class="lbl">'+DIAS_ABREV[isoToDate(dd.iso).getDay()]+'</span></div>';
  });
  return html+'</div>';
}

function viewRotina(){
  const dow=UI.rotinaDia;
  const hojeDow=new Date().getDay();
  let html='<section class="card"><h2>Rotina semanal</h2><div class="dias-nav">';
  [1,2,3,4,5,6,0].forEach(di=>{
    html+='<button data-action="rotina-dia" data-d="'+di+'" class="'+(di===dow?'sel':'')+'">'+DIAS_ABREV[di]+(di===hojeDow?' •':'')+'</button>';
  });
  html+='</div>';
  const blocos=blocosDoDia(dow);
  const agoraMin=hmParaMin(agoraHM());
  if(!blocos.length) html+='<p class="muted mt">Dia sem blocos ainda — toca em “+ Bloco” aqui embaixo pra montar.</p>';
  blocos.forEach((b,ix)=>{
    const cor=corCat(b.tipo);
    const ehAgora=dow===hojeDow&&b.f&&agoraMin>=hmParaMin(b.i)&&agoraMin<hmParaMin(b.f);
    html+='<div class="bloco '+(ehAgora?'agora-marca':'')+'">'
      +'<span class="tag" style="background:'+cor+'"></span>'
      +'<span class="hora num">'+esc(b.i)+(b.f?'–'+esc(b.f):'')+'</span>'
      +'<span class="txt">'+esc(b.t)+'</span>'
      +(b.tipo==='treino'?'<button class="btn mini sec-btn" data-action="abrir-treino-dia" data-d="'+dow+'" style="flex:none;align-self:center">Cargas ›</button>':'')
      +'<button class="edit" data-action="bloco-edit" data-d="'+dow+'" data-ix="'+ix+'" aria-label="Editar bloco">✎</button>'
      +'</div>';
  });
  html+='<div class="acoes mt-lg" style="display:flex;gap:0.5rem;flex-wrap:wrap">'
    +'<button class="btn sec-btn" data-action="bloco-add" data-d="'+dow+'">+ Bloco</button>'
    +(assistenteDisponivel()?'<button class="btn sec-btn" data-action="assist-abrir">🤖 Pedir ajuda ao assistente</button>':'')
    +'</div></section>';

  const semAtiva=(S.treinos.semanaAtiva==='B')?'B':'A';
  const usaB=S.treinos.split.some(x=>x.semana==='B'&&(x.exercicios.length||x.foco||x.diaSemana!=null));
  const linhaTreino=x=>{
    const nEx=x.exercicios.length;
    const diaTx=(x.diaSemana!=null)?DIAS_ABREV[x.diaSemana]:(x.dia||'');
    return '<div class="linha"><button class="hab esq" data-action="abrir-treino" data-id="'+esc(x.id)+'" style="flex:1">'
      +'<span class="nome">'+esc(x.nome)+(diaTx?' <span class="muted small">'+esc(diaTx)+'</span>':'')
      +'<span class="sub">'+(x.foco?esc(x.foco)+' · ':'')+(nEx?nEx+' exercício'+(nEx>1?'s':''):'toque pra adicionar exercícios')+'</span></span>'
      +'<span class="streak">›</span></button>'
      +'<button class="edit" data-action="treino-edit" data-id="'+esc(x.id)+'" aria-label="Editar treino">✎</button></div>';
  };
  html+='<section class="card"><h2>Treinos <span class="chip">semana ativa: '+semAtiva+'</span>'
    +'<button class="btn mini sec-btn dir" data-action="semana-toggle">Usar semana '+(semAtiva==='A'?'B':'A')+'</button></h2>'
    +'<p class="muted small">Toca num treino pra registrar as cargas — e no ✎ pra dar nome, foco e dia da semana.</p>';
  html+='<div class="grupo-titulo">Semana A'+(semAtiva==='A'?' · ativa':'')+'</div>';
  S.treinos.split.filter(x=>x.semana!=='B').forEach(x=>{ html+=linhaTreino(x); });
  if(usaB||semAtiva==='B'){
    html+='<div class="grupo-titulo">Semana B'+(semAtiva==='B'?' · ativa':'')+'</div>';
    S.treinos.split.filter(x=>x.semana==='B').forEach(x=>{ html+=linhaTreino(x); });
  } else {
    html+='<details class="mt"><summary class="muted small">Semana B — pra quem alterna fichas (ex.: padrão × metabólico)</summary>';
    S.treinos.split.filter(x=>x.semana==='B').forEach(x=>{ html+=linhaTreino(x); });
    html+='</details>';
  }
  html+=(S.treinos.aviso?'<div class="aviso mt">'+esc(S.treinos.aviso)+'</div>':'')+'</section>';

  html+='<section class="card"><h2>Cadernos de estudo <button class="btn mini sec-btn dir" data-action="caderno-add">+ Tema</button></h2>';
  if(!S.estudo.cadernos.length) html+='<p class="muted small">Cria um tema pra guardar suas anotações.</p>';
  S.estudo.cadernos.forEach(c=>{
    const n=c.notas.length;
    html+='<button class="hab esq" data-action="abrir-caderno" data-id="'+esc(c.id)+'" style="width:100%">'
      +'<span class="nome">'+esc(c.nome)+'<span class="sub">'+(n?n+' anotação'+(n>1?'ões':''):'sem anotações ainda')+'</span></span>'
      +'<span class="streak">›</span></button>';
  });
  html+='</section>';

  html+='<section class="card"><h2>Legenda</h2><div style="display:flex;flex-wrap:wrap;gap:0.4rem">';
  categorias().forEach(c=>{
    html+='<span class="chip"><span style="display:inline-block;width:9px;height:9px;border-radius:2px;background:'+esc(c.cor)+';margin-right:4px"></span>'+esc(c.nome)+'</span>';
  });
  html+='</div></section>';
  return html;
}

function viewDieta(){
  let html='';
  if(S.diet.alvo||S.diet.aviso){
    html+='<section class="card"><h2>Plano alimentar</h2>'
      +(S.diet.alvo?'<p class="sec small">'+esc(S.diet.alvo)+'</p>':'')
      +(S.diet.aviso?'<div class="aviso mt">📋 '+esc(S.diet.aviso)+'</div>':'')+'</section>';
  }

  html+='<section class="card"><h2>Refeições <button class="btn mini sec-btn dir" data-action="ref-add">+ Refeição</button></h2>';
  if(!S.diet.refeicoes.length){
    html+='<p class="muted small">Monte seu plano: adicione suas refeições com os itens de cada uma — ou peça pro assistente 🤖 montar pra você.</p>';
  } else {
    S.diet.refeicoes.forEach(r=>{
      html+='<div class="refeicao-card">'
        +'<div class="linha"><b class="esq">'+esc(r.nome)+' <span class="muted num small">'+esc(r.hora)+'</span></b>'
        +((r.kcal||r.prot)?'<span class="chip num">~'+r.kcal+' kcal · '+r.prot+'g prot</span>':'')
        +'<button class="edit" data-action="ref-edit" data-id="'+esc(r.id)+'" aria-label="Editar">✎</button></div>'
        +'<ul>'+r.itens.map(i=>'<li>'+esc(i)+'</li>').join('')+'</ul>'
        +(r.subs&&r.subs.length?'<details class="subs"><summary>Substituições</summary><ul>'+r.subs.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ul></details>':'')
        +'</div>';
    });
    const somaK=S.diet.refeicoes.reduce((a,r)=>a+r.kcal,0);
    const somaP=S.diet.refeicoes.reduce((a,r)=>a+r.prot,0);
    if(somaK||somaP) html+='<div class="linha mt"><span class="esq muted small">Total do plano</span><span class="chip num">~'+somaK+' kcal · '+somaP+'g prot</span></div>';
  }
  html+='</section>';

  html+='<section class="card"><h2>Regras de energia constante</h2>'
    +(S.diet.constante.length?'<ul style="margin-left:1.1rem" class="sec small">'+S.diet.constante.map(c=>'<li style="margin:0.25rem 0">'+esc(c)+'</li>').join('')+'</ul>':'')
    +'<p class="muted small mt">'+esc(S.diet.hidratacao)+'</p></section>';

  const ult=S.pesos.length?S.pesos[S.pesos.length-1]:null;
  html+='<section class="card"><h2>Peso (sábado, em jejum)</h2>'
    +'<div class="linha"><div class="esq">'
    +(ult?'<span class="hero-num num">'+esc(String(ult.kg).replace('.',','))+'</span> <span class="muted">kg em '+fmtData(ult.data)+'</span>':'<span class="muted">Nenhum peso registrado ainda.</span>')
    +'</div><button class="btn mini" data-action="peso-add">Registrar</button></div>'
    +graficoPeso()
    +'</section>';
  return html;
}

function graficoPeso(){
  const pts=S.pesos.slice(-12);
  if(pts.length<2) return '<p class="muted small mt">Registre toda semana pra ver a linha de tendência aqui.</p>';
  const vals=pts.map(p=>p.kg);
  const mn=Math.min(...vals)-0.5, mx=Math.max(...vals)+0.5;
  const W=560,H=110,PAD=8;
  const x=i=>PAD+i*(W-2*PAD)/(pts.length-1);
  const y=v=>H-PAD-(v-mn)*(H-2*PAD)/(mx-mn||1);
  let path='';
  pts.forEach((p,i)=>{ path+=(i?'L':'M')+x(i).toFixed(1)+' '+y(p.kg).toFixed(1)+' '; });
  let svg='<svg class="peso-chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Evolução do peso">'
    +'<path d="'+path+'" fill="none" stroke="var(--series-1)" stroke-width="2" stroke-linecap="round"/>';
  pts.forEach((p,i)=>{
    svg+='<circle cx="'+x(i).toFixed(1)+'" cy="'+y(p.kg).toFixed(1)+'" r="3.5" fill="var(--series-1)"><title>'+fmtData(p.data)+': '+p.kg+' kg</title></circle>';
  });
  const u=pts[pts.length-1];
  svg+='<text x="'+(x(pts.length-1)-4)+'" y="'+(y(u.kg)-8)+'" text-anchor="end" font-size="11" fill="var(--ink-2)" class="num">'+String(u.kg).replace('.',',')+'</text>';
  svg+='</svg>';
  return svg;
}
