'use strict';

function viewTreinoDetalhe(idTreino){
  const t=treinoPorId(idTreino);
  if(!t){ UI.sub=null; return viewRotina(); }
  let html='<section class="card">'
    +'<button class="btn mini sec-btn" data-action="voltar-sub">← Voltar</button>'
    +'<h2 class="mt">'+esc(t.nome)+' <span class="muted small">'+((t.diaSemana!=null)?DIAS_NOME[t.diaSemana]:esc(t.dia||''))+'</span><span class="chip">Semana '+esc(t.semana||'A')+'</span></h2>'
    +'<p class="sec small">'+esc(t.foco)+'</p>'
    +(t.exercicios.length?'<button class="btn mini sec-btn mt" data-action="treino-exportar" data-id="'+esc(t.id)+'">📤 Compartilhar este treino</button>':'')
    +'</section>';

  if(!t.exercicios.length){
    html+='<section class="card"><p class="muted">Nenhum exercício ainda. Adiciona os que você faz nesse treino — na próxima vez o app te lembra da última carga.</p>'
      +((typeof assistenteDisponivel==='function'&&assistenteDisponivel())?'<button class="btn bloco mt" data-action="foto-plano" data-t="treino">📸 Fotografar minha ficha do personal</button>':'')
      +'</section>';
  }

  t.exercicios.forEach(ex=>{
    const ult=ultimoRegistro(ex);
    html+='<section class="card">'
      +'<div class="linha"><b class="esq">'+esc(ex.nome)+'</b>'
      +'<button class="btn mini sec-btn" data-action="carga-add" data-t="'+esc(t.id)+'" data-e="'+esc(ex.id)+'">+ Série</button>'
      +'<button class="edit" data-action="ex-remover" data-t="'+esc(t.id)+'" data-e="'+esc(ex.id)+'" aria-label="Remover exercício">✕</button></div>';
    if(ult){
      html+='<div class="muted small mt">Última vez ('+fmtData(ult.data)+'): <b class="sec">'+ult.series+'×'+ult.reps+' · '+String(ult.carga).replace('.',',')+' kg</b>'+(ult.descanso?' <span class="muted">· descanso '+esc(ult.descanso)+'</span>':'')+'</div>';
      html+=graficoEvolucao(ex);

      const recentes=ex.registros.slice().sort((a,b)=>a.data<b.data?1:-1).slice(0,6);
      html+='<details class="mt"><summary class="muted small">Histórico ('+ex.registros.length+')</summary><table class="tabela mt"><thead><tr><th>Data</th><th class="num">Séries×Reps</th><th class="num">Carga</th><th></th></tr></thead><tbody>';
      recentes.forEach(r=>{ html+='<tr><td class="num">'+fmtData(r.data)+'</td><td class="num">'+r.series+'×'+r.reps+'</td><td class="num">'+String(r.carga).replace('.',',')+' kg'+(r.descanso?'<br><span class="muted small">'+esc(r.descanso)+'</span>':'')+'</td>'
        +'<td><button class="edit" data-action="carga-del" data-t="'+esc(t.id)+'" data-e="'+esc(ex.id)+'" data-r="'+esc(r.id||'')+'" aria-label="Apagar este registro">✕</button></td></tr>'; });
      html+='</tbody></table></details>';
    } else {
      html+='<div class="muted small mt">Sem registro ainda — toque em “+ série” pra lançar a primeira.</div>';
    }
    html+='</section>';
  });

  html+='<section class="card"><button class="btn bloco" data-action="ex-add" data-t="'+esc(t.id)+'">+ Adicionar exercício</button></section>';
  return html;
}

function graficoEvolucao(ex){
  const pts=evolucaoCarga(ex);
  if(pts.length<2) return '';
  const vals=pts.map(p=>p.carga);
  const mn=Math.min(...vals), mx=Math.max(...vals);
  const W=520,H=90,PAD=8;
  const x=i=>PAD+i*(W-2*PAD)/(pts.length-1);
  const y=v=>mx===mn?H/2:H-PAD-(v-mn)*(H-2*PAD)/(mx-mn);
  let path='';
  pts.forEach((p,i)=>{ path+=(i?'L':'M')+x(i).toFixed(1)+' '+y(p.carga).toFixed(1)+' '; });
  let svg='<svg class="peso-chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Evolução da carga" style="height:90px">'
    +'<path d="'+path+'" fill="none" stroke="var(--good)" stroke-width="2" stroke-linecap="round"/>';
  pts.forEach((p,i)=>{ svg+='<circle cx="'+x(i).toFixed(1)+'" cy="'+y(p.carga).toFixed(1)+'" r="3" fill="var(--good)"><title>'+fmtData(p.data)+': '+p.carga+' kg</title></circle>'; });
  const u=pts[pts.length-1];
  const subiu=u.carga>=pts[0].carga;
  svg+='<text x="'+(x(pts.length-1)-4)+'" y="'+(y(u.carga)-7)+'" text-anchor="end" font-size="11" fill="var(--ink-2)" class="num">'+String(u.carga).replace('.',',')+'</text></svg>'
    +'<div class="muted small">'+(subiu?'📈 evoluindo':'📉 caiu')+' — '+String(pts[0].carga).replace('.',',')+' → '+String(u.carga).replace('.',',')+' kg</div>';
  return svg;
}

// Calendário do mês: cada dia mostra quanto saiu, e tocar num dia abre o dia.
function calendarioGastos(mesSel,hoje){
  const dowIni=isoToDate(mesSel+'-01').getDay();
  const ultimo=Number(addDias(mesDeslocado(mesSel,1)+'-01',-1).slice(8,10));
  const porDia={};
  gastosDoMes(mesSel).forEach(g=>{ porDia[g.data]=(porDia[g.data]||0)+(g.valor||0); });
  let html='<div class="cal-grana mt">';
  DIAS_ABREV.forEach(d=>{ html+='<div class="cal-cab">'+esc(d.charAt(0))+'</div>'; });
  for(let i=0;i<dowIni;i++) html+='<div></div>';
  for(let dia=1;dia<=ultimo;dia++){
    const iso=mesSel+'-'+pad2(dia);
    const tot=porDia[iso]||0;
    const cls='cal-dia'+(iso===hoje?' hoje':'')+(iso===UI.granaDia?' sel':'')+(tot>0?' tem':'');
    if(iso>hoje){
      html+='<div class="cal-dia futuro"><span class="cal-n num">'+dia+'</span></div>';
    } else {
      html+='<button type="button" class="'+cls+'" data-action="grana-dia" data-d="'+iso+'"'
        +' aria-label="Dia '+dia+' — '+(tot>0?fmtBRL(tot):'sem gasto')+'">'
        +'<span class="cal-n num">'+dia+'</span>'
        +'<span class="cal-tot num">'+(tot>0?fmtBRLCurto(tot):'')+'</span></button>';
    }
  }
  return html+'</div>';
}
function secaoGastos(){
  const hoje=hojeISO();
  const mesAtual=hoje.slice(0,7);
  const mesSel=(UI.granaMes&&/^\d{4}-\d{2}$/.test(UI.granaMes))?UI.granaMes:mesAtual;
  const ehMesAtual=(mesSel===mesAtual);
  const diaAberto=!!(UI.granaDia&&UI.granaDia.slice(0,7)===mesSel);
  const doDia=gastosDoDia(hoje);
  const doMes=gastosDoMes(mesSel);
  const totDia=totalLista(doDia), totMes=totalLista(doMes);
  const porCat=gastosPorCategoria(doMes);

  let html='<section class="card"><h2>Gastos</h2>'
    +'<div class="linha">'
    +(ehMesAtual
      ? '<div class="esq"><span class="hero-num num">'+fmtBRL(totDia)+'</span><div class="hero-sub">gasto hoje</div></div>'
        +'<div style="text-align:right"><b class="num">'+fmtBRL(totMes)+'</b><div class="hero-sub">no mês</div></div>'
      : '<div class="esq"><span class="hero-num num">'+fmtBRL(totMes)+'</span><div class="hero-sub">em '+esc(fmtMes(mesSel))+'</div></div>'
        +'<div style="text-align:right"><b class="num">'+doMes.length+'</b><div class="hero-sub">lançamentos</div></div>')
    +'</div>'
    +'<div class="linha mt" style="gap:0.4rem">'
    +'<button class="btn mini sec-btn" data-action="grana-mes" data-m="'+mesDeslocado(mesSel,-1)+'" aria-label="Mês anterior">‹</button>'
    +'<span class="esq small" style="text-align:center">'+esc(fmtMes(mesSel))+'</span>'
    +(ehMesAtual
      ? '<button class="btn mini sec-btn" disabled style="opacity:0.35" aria-label="Mês seguinte">›</button>'
      : '<button class="btn mini sec-btn" data-action="grana-mes" data-m="'+mesDeslocado(mesSel,1)+'" aria-label="Mês seguinte">›</button>')
    +'</div>'
    +calendarioGastos(mesSel,hoje)
    +'<p class="muted small">Toca num dia pra ver e lançar o gasto <b>daquele dia</b> — dá pra fechar a semana toda de uma vez.</p>'
    +(diaAberto?'':'<button class="btn bloco mt" data-action="gasto-add">+ Registrar gasto</button>');

  if(diaAberto){
    const doSel=gastosDoDia(UI.granaDia).slice().sort((a,b)=>a.id<b.id?1:-1);
    html+='<div class="grupo-titulo">'+(UI.granaDia===hoje?'Hoje':esc(fmtDataLonga(UI.granaDia)))+' · '+fmtBRL(totalLista(doSel))+'</div>';
    if(!doSel.length) html+='<p class="muted small">Nada lançado nesse dia ainda.</p>';
    doSel.forEach(g=>{
      const c=catGasto(g.cat);
      html+='<div class="linha" style="padding:0.35rem 0;border-bottom:1px solid var(--grid)">'
        +'<span style="width:1.4rem;text-align:center">'+esc(c.icone)+'</span>'
        +'<span class="esq small">'+esc(g.desc||c.nome)+'</span>'
        +'<span class="num small">'+fmtBRL(g.valor)+'</span>'
        +'<button class="edit" data-action="gasto-remover" data-id="'+esc(g.id)+'" aria-label="Remover">✕</button></div>';
    });
    html+='<button class="btn bloco mt" data-action="gasto-add" data-d="'+esc(UI.granaDia)+'">+ Registrar gasto em '+esc(fmtData(UI.granaDia))+'</button>';
  }

  if(porCat.length){
    const max=porCat[0].total;
    html+='<div class="mt">';
    porCat.forEach(pc=>{
      const w=Math.round(100*pc.total/max);
      html+='<div class="linha" style="padding:0.3rem 0;gap:0.5rem">'
        +'<span style="width:1.4rem;text-align:center">'+esc(pc.cat.icone)+'</span>'
        +'<span class="small" style="width:6.5rem">'+esc(pc.cat.nome)+'</span>'
        +'<span class="progress" style="flex:1"><span style="width:'+w+'%;background:'+esc(pc.cat.cor)+'"></span></span>'
        +'<span class="num small" style="width:5rem;text-align:right">'+fmtBRL(pc.total)+'</span></div>';
    });
    html+='</div>';
  }

  const doMesLista=doMes.slice().sort((a,b)=>a.data<b.data?1:(a.data>b.data?-1:(a.id<b.id?1:-1)));
  if(doMesLista.length){
    html+='<details class="mt"'+(ehMesAtual?'':' open')+'><summary class="muted small">📅 Extrato de '+esc(fmtMes(mesSel))+' ('+doMesLista.length+(doMesLista.length===1?' lançamento':' lançamentos')+')</summary>';
    let diaG=null;
    doMesLista.forEach(g=>{
      if(g.data!==diaG){
        diaG=g.data;
        const totD=totalLista(doMesLista.filter(x=>x.data===diaG));
        html+='<div class="grupo-titulo">'+(diaG===hoje?'Hoje':fmtData(diaG))+' · '+fmtBRL(totD)+'</div>';
      }
      const c=catGasto(g.cat);
      html+='<div class="linha" style="padding:0.35rem 0;border-bottom:1px solid var(--grid)">'
        +'<span style="width:1.4rem;text-align:center">'+esc(c.icone)+'</span>'
        +'<span class="esq small">'+esc(g.desc||c.nome)+'</span>'
        +'<span class="num small">'+fmtBRL(g.valor)+'</span>'
        +'<button class="edit" data-action="gasto-remover" data-id="'+esc(g.id)+'" aria-label="Remover">✕</button></div>';
    });
    html+='</details>';
  }
  if(!doMesLista.length) html+='<p class="muted small mt">Nenhum gasto em '+esc(fmtMes(mesSel))+'.</p>';
  html+='<p class="muted small mt">Anota na hora — no fim do mês você enxerga pra onde o dinheiro foi.</p>';
  return html+'</section>';
}

function viewCadernoDetalhe(idCaderno){
  const c=cadernoPorId(idCaderno);
  if(!c){ UI.sub=null; return viewRotina(); }
  let html='<section class="card">'
    +'<button class="btn mini sec-btn" data-action="voltar-sub">← Voltar</button>'
    +'<div class="linha mt"><h2 class="esq">📓 '+esc(c.nome)+'</h2>'
    +'<button class="edit" data-action="caderno-remover" data-id="'+esc(c.id)+'" aria-label="Excluir caderno">✕</button></div>'
    +'<div class="campo mt"><textarea id="nota-nova" rows="3" placeholder="O que você estudou/aprendeu? (uma anotação)"></textarea></div>'
    +'<button class="btn bloco" data-action="nota-salvar" data-id="'+esc(c.id)+'">Adicionar anotação</button>'
    +'<p class="muted small mt">Depois dá pra pedir um resumo ou mapa mental disso (chega na próxima fase 🤖).</p>'
    +'</section>';

  if(!c.notas.length){
    html+='<section class="card"><p class="muted">Nenhuma anotação ainda. Escreve a primeira aí em cima.</p></section>';
  } else {
    const notas=c.notas.slice().sort((a,b)=>(a.ts||a.data)<(b.ts||b.data)?1:-1);
    html+='<section class="card"><h2>Anotações ('+c.notas.length+')</h2>';
    notas.forEach(n=>{
      html+='<div class="refeicao-card"><div class="linha"><span class="muted small num esq">'+fmtData(n.data)+'</span>'
        +'<button class="edit" data-action="nota-remover" data-c="'+esc(c.id)+'" data-n="'+esc(n.id)+'" aria-label="Remover anotação">✕</button></div>'
        +'<div class="sec" style="white-space:pre-wrap">'+esc(n.texto)+'</div></div>';
    });
    html+='</section>';
  }
  return html;
}
