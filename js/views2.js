'use strict';

function viewGrana(){
  let html=secaoGastos();

  const temDividas=S.finance.dividas.length>0;
  if(!temDividas){
    html+='<section class="card"><h2>Dívidas <span class="chip">opcional</span></h2>'
      +'<p class="muted small">Tem dívidas pra organizar? O Constante monta uma fila (bola de neve) e te mostra quando você fica livre delas.</p>'
      +'<button class="btn sec-btn mt" data-action="divida-add">+ adicionar dívida</button></section>';
    return html;
  }

  const fin=resumoFinanceiro();
  const pct=fin.total?Math.round(100*fin.pago/fin.total):0;
  html+='<section class="card"><h2>Dívidas — visão geral</h2>'
    +'<div class="linha"><div class="esq"><span class="hero-num num">'+fmtBRL(fin.saldo)+'</span><div class="hero-sub">faltam · já pagou '+fmtBRL(fin.pago)+' de '+fmtBRL(fin.total)+'</div></div>'
    +'<span class="chip num">'+pct+'%</span></div>'
    +'<div class="progress verde mt"><span style="width:'+pct+'%"></span></div>'
    +'<div class="linha mt"><span class="esq muted small">Renda: <b class="num">'+fmtBRL(fin.renda)+'</b>/mês</span>'
    +'<span class="muted small">Aporte: <b class="num">'+fmtBRL(S.finance.aporteMensal)+'</b>/mês <button class="btn mini sec-btn" data-action="aporte-edit">mudar</button></span></div>'
    +'</section>';

  html+='<section class="card"><h2>Fila de pagamento (bola de neve) <button class="btn mini sec-btn dir" data-action="divida-add">+ dívida</button></h2>';
  S.finance.dividas.forEach((dv,ix)=>{
    const saldo=saldoDivida(dv);
    const pctD=Math.round(100*(dv.total-saldo)/dv.total);
    const quit=saldo<=0.005;
    const idSeguro=esc(dv.id);
    html+='<div class="divida '+(quit?'quitada':'')+'">'
      +'<div class="topo"><span class="chip num">'+(ix+1)+'º</span><span class="nome">'+esc(dv.nome)+'</span>'
      +'<span class="valores num">'+(quit?'✅ quitada!':fmtBRL(saldo)+' de '+fmtBRL(dv.total))+'</span></div>'
      +'<div class="progress verde fina"><span style="width:'+pctD+'%"></span></div>'
      +'<div class="linha mt">'
      +(quit?'':'<button class="btn mini esq" data-action="pagar" data-id="'+idSeguro+'">💸 registrar pagamento</button>')
      +'<button class="btn mini sec-btn" data-action="divida-edit" data-id="'+idSeguro+'">✎</button>'
      +'</div>'
      +(dv.pagos.length?'<details><summary>histórico ('+dv.pagos.length+')</summary><ul style="margin-left:1.1rem" class="small sec">'
        +dv.pagos.map(p=>'<li class="num">'+fmtData(p.data)+' — '+fmtBRL(p.valor)+'</li>').join('')+'</ul></details>':'')
      +'</div>';
  });
  html+='</section>';

  const proj=projecaoDividas();
  html+='<section class="card"><h2>Projeção de quitação</h2>';
  if(proj.incompleta){
    html+='<div class="aviso">Com o aporte atual, a quitação passa de 10 anos — aumenta o aporte mensal pra encurtar isso.</div>'
      +'<button class="btn sec-btn mt" data-action="aporte-edit">ajustar aporte mensal</button>';
  } else if(proj.fim){
    html+='<div class="ok-box">Mantendo '+fmtBRL(S.finance.aporteMensal)+'/mês, você fica <b>livre de dívidas em '+esc(proj.fim)+'</b> 🕊️ — e cada economia que virar pagamento antecipa isso.</div>';
    html+='<details class="mt"><summary class="muted small">ver mês a mês</summary><table class="tabela mt"><thead><tr><th>Mês</th><th>Pagamentos</th><th class="num">Resta</th></tr></thead><tbody>';
    proj.meses.forEach(mm=>{
      html+='<tr><td class="num">'+esc(mm.label)+'</td><td>'+mm.pagamentos.map(p=>esc(p.nome)+' '+fmtBRL(p.valor)+(p.quitou?' ✅':'')).join('<br>')+'</td><td class="num">'+fmtBRL(mm.resta)+'</td></tr>';
    });
    html+='</tbody></table></details>';
  } else {
    html+='<p class="muted">Define um aporte mensal maior que zero pra ver a projeção.</p>'
      +'<button class="btn sec-btn mt" data-action="aporte-edit">definir aporte mensal</button>';
  }
  html+='</section>';

  return html;
}

function secaoReducao(){
  const jaUsou=Object.keys(S.days).some(k=>S.days[k].apostas&&S.days[k].apostas.length);
  if(!S.bets.ativo && !jaUsou){
    return '<section class="card"><h2>Reduzir um hábito <span class="chip">opcional</span></h2>'
      +'<p class="muted small">Tem algum hábito que você quer diminuir aos poucos — redes sociais, jogos, telas de madrugada, doces, cigarro? Sem corte seco: o Constante define um limite semanal que cai sozinho até a meta, com um apoio pra quando bater a vontade.</p>'
      +'<button class="btn sec-btn mt" data-action="apostas-ativar">ativar plano de redução</button></section>';
  }
  const u=unidadeBets();
  const nomeAlvo=(S.bets.alvo||'').trim()||'seu hábito';
  const titulo=nomeAlvo.charAt(0).toUpperCase()+nomeAlvo.slice(1);
  const wk=semanaDoPlano();
  const lim=limiteSemana(wk);
  const gasto=gastoNaSemana(wk);
  const resto=Math.max(0,lim-gasto);
  const estourou=gasto>lim;
  const econ=economiaDisponivel();
  let html='<section class="card"><h2>'+esc(titulo)+' — redução gradual</h2>'
    +'<div class="gauge-lbl"><span>Semana '+(wk+1)+' de '+S.bets.semanasParaZero+(lim===0?' — 🎯 fase meta':'')+'</span><span class="num">'+fmtUnidade(gasto,u)+' / '+fmtUnidade(lim,u)+'</span></div>'
    +'<div class="progress '+(estourou?'':'azul')+'"><span style="width:'+Math.min(100,lim?Math.round(100*gasto/lim):(gasto>0?100:0))+'%'+(estourou?';background:var(--critical)':'')+'"></span></div>'
    +(estourou?'<div class="aviso mt">⚠️ Passou do limite desta semana. Sem culpa — registra, respira (🌊) e volta pro plano. O que importa é a tendência.</div>'
             :'<div class="muted small mt">Ainda dentro do limite nesta semana: <b class="num">'+fmtUnidade(resto,u)+'</b>.</div>')
    +'<div class="acoes mt" style="display:flex;gap:0.5rem;flex-wrap:wrap">'
    +'<button class="btn sec-btn" data-action="apostar">registrar uso</button>'
    +'<button class="btn" data-action="sos-abrir">🌊 tô com vontade</button>'
    +'</div>';
  if(u==='brl' && econ>0 && S.finance.dividas.length){
    html+='<div class="ok-box mt">💰 Você deixou de gastar <b class="num">'+fmtBRL(econ)+'</b> nas semanas fechadas. '
      +'<button class="btn mini mt" data-action="economia-transferir">transformar em pagamento de dívida</button></div>';
  } else if(u!=='brl' && econ>0){
    html+='<div class="ok-box mt">🎉 Você ficou <b class="num">'+fmtUnidade(econ,u)+'</b> abaixo do limite nas semanas fechadas. Cada semana dentro da meta é um degrau.</div>';
  }
  if(wk>0){
    html+='<details class="mt"><summary class="muted small">semanas anteriores</summary><table class="tabela mt"><thead><tr><th>Semana</th><th class="num">Limite</th><th class="num">Registrado</th><th>Status</th></tr></thead><tbody>';
    for(let w=Math.max(0,wk-8);w<wk;w++){
      const g=gastoNaSemana(w), l=limiteSemana(w);
      html+='<tr><td class="num">'+(w+1)+'</td><td class="num">'+fmtUnidade(l,u)+'</td><td class="num">'+fmtUnidade(g,u)+'</td><td>'+(g<=l?'✅ dentro':'❌ passou')+'</td></tr>';
    }
    html+='</tbody></table></details>';
  }
  return html+'<p class="muted small mt">'+esc(S.bets.nota)+'</p></section>';
}

function viewMente(){
  let html='';

  const metaH=horasEntre(S.settings.sono.deitar,S.settings.sono.acordar);
  let barras='',soma=0,n=0;
  for(let i=6;i>=0;i--){
    const iso=addDias(hojeISO(),-i);
    const rec=S.days[iso];
    let hDorm=null;
    if(rec&&rec.sono){ hDorm=rec.sono.h!=null&&rec.sono.h!==''?Number(rec.sono.h):(rec.sono.deitou&&rec.sono.acordou?horasEntre(rec.sono.deitou,rec.sono.acordou):null); }
    if(hDorm!=null&&!isNaN(hDorm)){ soma+=hDorm; n++; }
    const alt=hDorm!=null?Math.max(3,Math.round(56*Math.min(hDorm,10)/10)):3;
    barras+='<div class="b '+(hDorm==null?'vazio':'')+'" style="height:'+alt+'px'+(hDorm!=null&&hDorm>=metaH-0.25?';background:var(--good)':'')+'" title="'+fmtData(iso)+': '+(hDorm!=null?String(hDorm).replace('.',',')+'h':'sem registro')+'"></div>';
  }
  html+='<section class="card"><h2>Sono — últimos 7 dias</h2>'
    +'<div class="linha-chart">'+barras+'</div>'
    +'<div class="linha mt"><span class="esq muted small">Média: <b class="num">'+(n?(soma/n).toFixed(1).replace('.',','):'—')+'h</b> · meta '+metaH.toFixed(1).replace('.',',')+'h ('+esc(S.settings.sono.deitar)+'→'+esc(S.settings.sono.acordar)+')</span>'
    +'<span class="chip">verde = na meta</span></div>'
    +'<p class="muted small mt">Sono é a fundação: protege teus remédios/suplementos fazendo efeito, o treino rendendo e a cabeça no lugar. Registra pela manhã: as horas que dormiu e, se tiver, a nota do teu dispositivo.</p></section>';

  const EMO=['😞','😕','😐','🙂','😄'];
  let hb='',eb='';
  for(let i=13;i>=0;i--){
    const iso=addDias(hojeISO(),-i);
    const rec=S.days[iso]||{};
    hb+='<div class="b '+(rec.humor?'':'vazio')+'" style="height:'+(rec.humor?rec.humor*12:3)+'px" title="'+fmtData(iso)+': '+(rec.humor?EMO[rec.humor-1]:'—')+'"></div>';
    eb+='<div class="b '+(rec.energia?'':'vazio')+'" style="height:'+(rec.energia?rec.energia*12:3)+'px;'+(rec.energia?'background:var(--brand)':'')+'" title="'+fmtData(iso)+': energia '+(rec.energia||'—')+'"></div>';
  }
  html+='<section class="card"><h2>Humor & energia — 14 dias</h2>'
    +'<label class="muted small">Humor</label><div class="linha-chart" style="height:64px">'+hb+'</div>'
    +'<label class="muted small mt" style="display:block">Energia</label><div class="linha-chart" style="height:64px">'+eb+'</div>'
    +'<p class="muted small mt">Check-in fica na aba Hoje. Padrões (ex.: energia caindo toda quinta) aparecem aqui — usa isso na revisão de domingo.</p></section>';

  const ultimo=ultimoBurnout();
  html+='<section class="card"><h2>Radar de burnout (semanal)</h2>';
  if(ultimo){
    const cor=ultimo.score<=3?'ok-box':(ultimo.score<=6?'aviso':'aviso');
    const rotulo=ultimo.score<=3?'🟢 verde — segue o jogo':(ultimo.score<=6?'🟡 amarelo — tira o pé um pouco':'🔴 vermelho — reduz a carga esta semana');
    html+='<div class="'+cor+'">Último check ('+fmtData(ultimo.data)+'): <b>'+rotulo+'</b> — '+ultimo.score+'/10</div>';
    if(ultimo.score>6) html+='<p class="sec small mt">Sugestões: corta o bloco de sites por 3 dias, treino vira caminhada leve, e conversa com alguém de confiança. Estudo mínimo só pra não perder o fio.</p>';
  } else {
    html+='<p class="muted small">Faz o primeiro check — leva 30 segundos. Ideal: todo domingo na revisão semanal.</p>';
  }
  html+='<button class="btn sec-btn mt" data-action="burnout-abrir">fazer check-in de burnout</button></section>';

  html+='<section class="card"><h2>Quando bate a vontade</h2>'
    +'<p class="sec small">Impulso é onda: cresce, faz pico e passa — surfar 10 minutos costuma bastar. O botão 🌊 te guia numa respiração 4-7-8 até a onda baixar.</p>'
    +'<button class="btn mt" data-action="sos-abrir">🌊 abrir o surf do impulso</button>'
    +'<p class="muted small mt">Dica: tirar o gatilho do alcance — app fora do celular, sem atalho, sem login salvo — reduz MUITO a força da onda.</p></section>';

  return html;
}

function secaoConquistas(){
  const todas=gerarConquistas();
  const ganhas=todas.filter(c=>c.ganha);
  const proximas=todas.filter(c=>c.proxima);
  let html='<section class="card"><h2>Conquistas — '+ganhas.length+' desbloqueada'+(ganhas.length===1?'':'s')+'</h2>';

  html+='<div class="grupo-titulo">Próximas metas</div>';
  proximas.forEach(c=>{
    const pct=c.meta>0?Math.min(100,Math.round(100*(c.valor||0)/c.meta)):0;
    html+='<div class="conquista"><span class="ic" style="filter:none;opacity:0.85">'+esc(c.icone)+'</span>'
      +'<span style="flex:1"><span class="nome">'+esc(c.nome)+'</span>'
      +'<div class="progress fina" style="margin:4px 0"><span style="width:'+pct+'%"></span></div>'
      +'<span class="desc">'+esc(c.desc)+'</span></span></div>';
  });

  if(ganhas.length){
    const recentes=ganhas.slice().sort((a,b)=>b.meta-a.meta).slice(0,8);
    html+='<div class="grupo-titulo">Desbloqueadas</div>';
    recentes.forEach(c=>{
      html+='<div class="conquista ganha"><span class="ic">'+esc(c.icone)+'</span>'
        +'<span><span class="nome">'+esc(c.nome)+'</span><br><span class="desc">'+esc(c.desc)+'</span></span></div>';
    });
    if(ganhas.length>8) html+='<p class="muted small mt centro">+ '+(ganhas.length-8)+' outras conquistas</p>';
  } else {
    html+='<p class="muted small mt">Suas conquistas aparecem aqui conforme você mantém a constância. Elas nunca param de crescer 🚀</p>';
  }
  return html+'</section>';
}

function horasEntre(hm1,hm2){
  let a=hmParaMin(hm1),b=hmParaMin(hm2);
  if(a==null||b==null) return 7.5;
  let d=b-a; if(d<=0) d+=1440;
  return Math.round(d/6)/10;
}
function ultimoBurnout(){
  const datas=Object.keys(S.days).sort().reverse();
  for(const iso of datas){
    if(S.days[iso].burnout) return {data:iso,...S.days[iso].burnout};
  }
  return null;
}

function viewConfig(){
  const st=S.settings;
  const fotoP=S.profile&&S.profile.foto;
  let html='<section class="card"><h2>Perfil & metas</h2>'
    +'<div style="display:flex;align-items:center;gap:0.8rem;margin-bottom:0.9rem">'
    +(fotoP?'<img src="'+esc(fotoP)+'" alt="foto de perfil" style="width:64px;height:64px;border-radius:50%;object-fit:cover;flex:none;border:2px solid var(--brand-strong)">':'<div style="width:64px;height:64px;border-radius:50%;flex:none;background:var(--surface-3);display:flex;align-items:center;justify-content:center;font-size:1.7rem">🙂</div>')
    +'<div class="acoes" style="display:flex;gap:0.4rem;flex-wrap:wrap">'
    +'<button class="btn mini sec-btn" data-action="perfil-foto">'+(fotoP?'trocar foto':'adicionar foto')+'</button>'
    +(fotoP?'<button class="btn mini perigo" data-action="perfil-foto-remover">remover</button>':'')
    +'<input type="file" id="perfil-foto-file" accept="image/*" class="escondido"></div>'
    +'</div>'
    +'<div class="cfg-grid">'
    +cfgCampo('Nome','profile.nome','text',S.profile.nome)
    +cfgCampo('Altura (cm)','profile.altura','number',S.profile.altura,'ex.: 170')
    +cfgCampo('Meta kcal/dia','profile.kcalAlvo','number',S.profile.kcalAlvo,'ex.: 2000')
    +cfgCampo('Proteína mín. (g)','profile.protMin','number',S.profile.protMin,'ex.: 100')
    +cfgCampo('Água (ml/dia)','profile.aguaAlvoMl','number',S.profile.aguaAlvoMl,'ex.: 2500')
    +'</div><p class="muted small mt">'+esc(S.profile.obsCalorimetria)+'</p></section>';

  html+='<section class="card"><h2>Sono</h2><div class="cfg-grid">'
    +cfgCampo('Deitar (seg–qui)','settings.sono.deitar','time',st.sono.deitar)
    +cfgCampo('Acordar (seg–sex)','settings.sono.acordar','time',st.sono.acordar)
    +cfgCampo('Deitar (sex/sáb)','settings.sono.deitarFds','time',st.sono.deitarFds)
    +cfgCampo('Acordar (fds)','settings.sono.acordarFds','time',st.sono.acordarFds)
    +cfgCampo('Melatonina','settings.sono.melatonina','time',st.sono.melatonina)
    +'</div></section>';

  html+='<section class="card"><h2>Hábitos <button class="btn mini sec-btn dir" data-action="habito-add">+ novo</button></h2><div class="lista-edit">';
  S.habits.forEach(hb=>{
    html+='<div class="item-edit"><span>'+esc(hb.icone)+'</span><span class="nome">'+esc(hb.nome)
      +' <span class="muted small">('+(hb.tipo==='evitar'?'evitar':'fazer')+' · '+hb.dias.map(d2=>DIAS_ABREV[d2]).join(',')+')</span></span>'
      +'<button class="btn mini sec-btn" data-action="habito-edit" data-id="'+esc(hb.id)+'">✎</button>'
      +'<button class="btn mini perigo" data-action="habito-del" data-id="'+esc(hb.id)+'">✕</button></div>';
  });
  html+='</div></section>';

  html+='<section class="card"><h2>Categorias da rotina <button class="btn mini sec-btn dir" data-action="cat-add">+ nova</button></h2>'
    +'<p class="muted small">Personalize os tipos de bloco da rotina — o nome e a cor. Apague as que não usa.</p>'
    +'<div class="lista-edit">';
  categorias().forEach(c=>{
    html+='<div class="item-edit">'
      +'<input type="color" value="'+esc(c.cor)+'" data-cat-cor="'+esc(c.id)+'" aria-label="cor" style="width:32px;height:28px;padding:0;border:none;background:none;flex:none">'
      +'<input type="text" class="nome" value="'+esc(c.nome)+'" data-cat-nome="'+esc(c.id)+'" maxlength="24" style="flex:1;min-width:0">'
      +'<button class="btn mini perigo" data-action="cat-del" data-id="'+esc(c.id)+'">✕</button></div>';
  });
  html+='</div></section>';

  // (plano de redução removido — dá pra marcar 'evitar' ao criar um hábito)

  html+='<section class="card"><h2>Rendas mensais</h2><div class="lista-edit">';
  S.finance.rendas.forEach((r,ix)=>{
    html+='<div class="item-edit"><span class="nome">'+esc(r.nome)+'</span><span class="num">'+fmtBRL(r.valor)+'</span>'
      +'<button class="btn mini sec-btn" data-action="renda-edit" data-ix="'+ix+'">✎</button></div>';
  });
  html+='</div><button class="btn mini sec-btn mt" data-action="renda-add">+ renda</button></section>';

  if(produtoAtivo()){
    const u=usuarioAtual();
    html+='<section class="card"><h2>Conta</h2>'
      +'<p class="sec">Logado como <b>'+esc(u?u.email:'—')+'</b></p>'
      +'<div class="linha mt"><label class="esq small sec"><input type="checkbox" style="width:auto" data-cfg-check="settings.syncAuto" '+(st.syncAuto?'checked':'')+'> sincronizar automático ao salvar</label></div>'
      +'<div class="acoes mt" style="display:flex;gap:0.5rem;flex-wrap:wrap">'
      +'<button class="btn" data-action="sync-agora">🔄 sincronizar agora</button>'
      +'<button class="btn sec-btn" data-action="conta-trocar-senha">trocar senha</button>'
      +'<button class="btn sec-btn" data-action="auth-sair">sair</button>'
      +'</div>'
      +'<p class="muted small mt">'+(st.ultimaSync?'Última sync: '+new Date(st.ultimaSync).toLocaleString('pt-BR'):'Ainda não sincronizado')+' · <a href="privacidade.html" target="_blank" rel="noopener">Política de Privacidade</a></p>'
      +'<button class="btn perigo bloco mt-lg" data-action="conta-apagar">apagar minha conta e todos os dados (LGPD)</button>'
      +'</section>';
  } else {
    html+='<section class="card"><h2>Sincronização (celular ↔ notebook)</h2>'
      +'<div class="campo"><label>URL do projeto Supabase</label><input type="url" data-cfg="settings.syncUrl" value="'+esc(st.syncUrl)+'" placeholder="https://xxxx.supabase.co"></div>'
      +'<div class="campo"><label>Chave anon (public)</label><input type="text" data-cfg="settings.syncKey" value="'+esc(st.syncKey)+'" placeholder="eyJhbGciOi..."></div>'
      +'<div class="campo"><label>Código de sincronização (igual nos 2 aparelhos — trata como senha)</label><input type="text" data-cfg="settings.syncCode" value="'+esc(st.syncCode)+'" placeholder="ex.: luiz-quadril-2026-x7k9"></div>'
      +'<div class="linha"><label class="esq small sec"><input type="checkbox" style="width:auto" data-cfg-check="settings.syncAuto" '+(st.syncAuto?'checked':'')+'> sincronizar automático ao salvar</label></div>'
      +'<div class="acoes mt" style="display:flex;gap:0.5rem;flex-wrap:wrap">'
      +'<button class="btn" data-action="sync-agora">🔄 sincronizar agora</button>'
      +'<button class="btn sec-btn" data-action="sync-baixar">⬇ baixar da nuvem</button>'
      +'</div>'
      +'<p class="muted small mt">'+(st.ultimaSync?'Última sync: '+new Date(st.ultimaSync).toLocaleString('pt-BR'):'Nunca sincronizado')+' · passo a passo no GUIA-PUBLICACAO.md</p></section>';
  }

  html+=secaoNotificacoes();
  html+=secaoLembretes();

  html+='<section class="card"><h2>Backup & dados</h2>'
    +'<div class="acoes" style="display:flex;gap:0.5rem;flex-wrap:wrap">'
    +'<button class="btn sec-btn" data-action="exportar">⬇ exportar backup</button>'
    +'<button class="btn sec-btn" data-action="importar">⬆ importar backup</button>'
    +'<input type="file" id="importar-arquivo" accept="application/json" class="escondido">'
    +'</div>'
    +'<button class="btn perigo bloco mt-lg" data-action="zerar">apagar tudo e recomeçar</button></section>';

  html+='<p class="centro muted small">Constante v1 🟣<br>Remédios e dieta: valide com seu médico e nutricionista.</p>';
  return html;
}

function cfgCampo(rotulo,caminho,tipo,valor,ph){
  const v=(valor==null?'':valor);
  return '<div class="campo"><label>'+esc(rotulo)+'</label><input type="'+tipo+'" data-cfg="'+caminho+'" value="'+esc(v)+'"'+(ph?' placeholder="'+esc(ph)+'"':'')+(tipo==='number'?' step="any"':'')+'></div>';
}
