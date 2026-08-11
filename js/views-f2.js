'use strict';

function viewTreinoDetalhe(idTreino){
  const t=treinoPorId(idTreino);
  if(!t){ UI.sub=null; return viewRotina(); }
  let html='<section class="card">'
    +'<button class="btn mini sec-btn" data-action="voltar-sub">← voltar</button>'
    +'<h2 class="mt">'+esc(t.nome)+' <span class="muted small">'+esc(t.dia)+'</span></h2>'
    +'<p class="sec small">'+esc(t.foco)+'</p></section>';

  if(!t.exercicios.length){
    html+='<section class="card"><p class="muted">Nenhum exercício ainda. Adiciona os que você faz nesse treino — na próxima vez o app te lembra da última carga.</p></section>';
  }

  t.exercicios.forEach(ex=>{
    const ult=ultimoRegistro(ex);
    html+='<section class="card">'
      +'<div class="linha"><b class="esq">'+esc(ex.nome)+'</b>'
      +'<button class="btn mini sec-btn" data-action="carga-add" data-t="'+esc(t.id)+'" data-e="'+esc(ex.id)+'">+ série</button>'
      +'<button class="edit" data-action="ex-remover" data-t="'+esc(t.id)+'" data-e="'+esc(ex.id)+'" aria-label="Remover exercício">✕</button></div>';
    if(ult){
      html+='<div class="muted small mt">Última vez ('+fmtData(ult.data)+'): <b class="sec">'+ult.series+'×'+ult.reps+' · '+String(ult.carga).replace('.',',')+' kg</b></div>';
      html+=graficoEvolucao(ex);

      const recentes=ex.registros.slice().sort((a,b)=>a.data<b.data?1:-1).slice(0,6);
      html+='<details class="mt"><summary class="muted small">histórico ('+ex.registros.length+')</summary><table class="tabela mt"><thead><tr><th>Data</th><th class="num">Séries×Reps</th><th class="num">Carga</th></tr></thead><tbody>';
      recentes.forEach(r=>{ html+='<tr><td class="num">'+fmtData(r.data)+'</td><td class="num">'+r.series+'×'+r.reps+'</td><td class="num">'+String(r.carga).replace('.',',')+' kg</td></tr>'; });
      html+='</tbody></table></details>';
    } else {
      html+='<div class="muted small mt">Sem registro ainda — toque em “+ série” pra lançar a primeira.</div>';
    }
    html+='</section>';
  });

  html+='<section class="card"><button class="btn bloco" data-action="ex-add" data-t="'+esc(t.id)+'">+ adicionar exercício</button></section>';
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

function secaoGastos(){
  const hoje=hojeISO();
  const doDia=gastosDoDia(hoje);
  const doMes=gastosDoMes(hoje.slice(0,7));
  const totDia=totalLista(doDia), totMes=totalLista(doMes);
  const porCat=gastosPorCategoria(doMes);

  let html='<section class="card"><h2>Gastos</h2>'
    +'<div class="linha"><div class="esq"><span class="hero-num num">'+fmtBRL(totDia)+'</span><div class="hero-sub">gasto hoje</div></div>'
    +'<div style="text-align:right"><b class="num">'+fmtBRL(totMes)+'</b><div class="hero-sub">no mês</div></div></div>'
    +'<button class="btn bloco mt" data-action="gasto-add">+ registrar gasto</button>';

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

  if(doDia.length){
    html+='<div class="grupo-titulo">Hoje</div>';
    doDia.slice().sort((a,b)=>a.id<b.id?1:-1).forEach(g=>{
      const c=catGasto(g.cat);
      html+='<div class="linha" style="padding:0.35rem 0;border-bottom:1px solid var(--grid)">'
        +'<span style="width:1.4rem;text-align:center">'+esc(c.icone)+'</span>'
        +'<span class="esq small">'+esc(g.desc||c.nome)+'</span>'
        +'<span class="num small">'+fmtBRL(g.valor)+'</span>'
        +'<button class="edit" data-action="gasto-remover" data-id="'+esc(g.id)+'" aria-label="Remover">✕</button></div>';
    });
  }
  html+='<p class="muted small mt">Anota na hora — no fim do mês você enxerga pra onde o dinheiro foi.</p>';
  return html+'</section>';
}

function viewCadernoDetalhe(idCaderno){
  const c=cadernoPorId(idCaderno);
  if(!c){ UI.sub=null; return viewRotina(); }
  let html='<section class="card">'
    +'<button class="btn mini sec-btn" data-action="voltar-sub">← voltar</button>'
    +'<div class="linha mt"><h2 class="esq">📓 '+esc(c.nome)+'</h2>'
    +'<button class="edit" data-action="caderno-remover" data-id="'+esc(c.id)+'" aria-label="Excluir caderno">✕</button></div>'
    +'<div class="campo mt"><textarea id="nota-nova" rows="3" placeholder="O que você estudou/aprendeu? (uma anotação)"></textarea></div>'
    +'<button class="btn bloco" data-action="nota-salvar" data-id="'+esc(c.id)+'">adicionar anotação</button>'
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
