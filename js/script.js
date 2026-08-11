'use strict';

function setPath(obj,caminho,valor){
  const partes=caminho.split('.');
  let o=obj;
  for(let i=0;i<partes.length-1;i++) o=o[partes[i]];
  const k=partes[partes.length-1];
  const antigo=o[k];
  o[k]=(typeof antigo==='number')?(Number(String(valor).replace(',','.'))||0):valor;
}

const ACOES={
  'fechar-modal':()=>{ fecharModal(); render(); },
  'sos-abrir':()=>abrirSOS(),

  'habit':el=>{
    const id=el.dataset.id; const d=getDia();
    if(d.habitos[id]===false){
      abrirModal('<h3>Limpar deslize?</h3><p class="sec small">Você registrou um deslize hoje em “'+esc(nomeHabito(id))+'”. Quer desfazer?</p>'
        +'<div class="acoes"><button class="btn sec-btn" data-action="fechar-modal">deixar como está</button>'
        +'<button class="btn" data-action="deslize-limpar" data-id="'+esc(id)+'">desfazer deslize</button></div>');
      return;
    }
    if(d.habitos[id]===true) delete d.habitos[id];
    else d.habitos[id]=true;
    recalcXP(hojeISO()); saveState(); render();
  },
  'deslize-limpar':el=>{ const d=getDia(); delete d.habitos[el.dataset.id]; recalcXP(hojeISO()); saveState(); fecharModal(); render(); },
  'deslize':el=>{
    const id=el.dataset.id;
    if(id==='apostas'){ ACOES['apostar'](); return; }
    abrirModal('<h3>Registrar deslize — '+esc(nomeHabito(id))+'</h3>'
      +'<p class="sec small">Sem culpa: registrar é o que transforma deslize em dado. A ofensiva desse hábito reinicia, o resto do dia continua valendo.</p>'
      +'<div class="acoes"><button class="btn sec-btn" data-action="fechar-modal">cancelar</button>'
      +'<button class="btn perigo" data-action="deslize-confirmar" data-id="'+esc(id)+'">registrar</button></div>'
      +'<p class="muted small mt">Dica: depois de registrar, usa o 🌊 se a vontade continuar.</p>');
  },
  'deslize-confirmar':el=>{
    const d=getDia(); d.habitos[el.dataset.id]=false;
    recalcXP(hojeISO()); saveState(); fecharModal(); render();
    toast('Registrado. Amanhã conta de novo 💪');
  },

  'ref':el=>{ const d=getDia(); const id=el.dataset.id; if(d.refeicoes[id]) delete d.refeicoes[id]; else d.refeicoes[id]=true; recalcXP(hojeISO()); saveState(); render(); },
  'med':el=>{ const d=getDia(); const id=el.dataset.id; if(d.meds[id]) delete d.meds[id]; else d.meds[id]=true; recalcXP(hojeISO()); saveState(); render(); },
  'agua':el=>{ const d=getDia(); d.agua=Math.max(0,(d.agua||0)+Number(el.dataset.ml)); recalcXP(hojeISO()); saveState(); render(); },
  'humor':el=>{ const d=getDia(); d.humor=Number(el.dataset.v); recalcXP(hojeISO()); saveState(); render(); },
  'energia':el=>{ const d=getDia(); d.energia=Number(el.dataset.v); recalcXP(hojeISO()); saveState(); render(); },

  'rotina-dia':el=>{ UI.rotinaDia=Number(el.dataset.d); render(); },
  'bloco-add':el=>abrirModalBloco(Number(el.dataset.d),null),
  'bloco-edit':el=>abrirModalBloco(Number(el.dataset.d),Number(el.dataset.ix)),
  'bloco-salvar':el=>{
    const d=Number(el.dataset.d), ix=el.dataset.ix===''?null:Number(el.dataset.ix);
    const i=val('bl-ini'), f=val('bl-fim'), t=val('bl-titulo'), tipo=val('bl-tipo');
    if(!i||!t){ toast('Preenche pelo menos início e título'); return; }
    const blocos=blocosDoDia(d);
    const novo={d,i,t,tipo}; if(f) novo.f=f;
    if(ix===null){ S.routine.push(novo); }
    else{
      const alvo=blocos[ix]; const pos=S.routine.indexOf(alvo);
      if(pos>=0) S.routine[pos]=novo;
    }
    saveState(); fecharModal(); render();
  },
  'bloco-remover':el=>{
    const d=Number(el.dataset.d), ix=Number(el.dataset.ix);
    const alvo=blocosDoDia(d)[ix]; const pos=S.routine.indexOf(alvo);
    if(pos>=0) S.routine.splice(pos,1);
    saveState(); fecharModal(); render();
  },

  'ref-edit':el=>{
    const r=S.diet.refeicoes.find(x=>x.id===el.dataset.id); if(!r) return;
    abrirModal('<h3>Editar refeição</h3>'
      +campo('re-nome','Nome','text',r.nome)+campo('re-hora','Horário','text',r.hora)
      +'<div class="grid-2">'+campo('re-kcal','kcal','number',r.kcal)+campo('re-prot','Proteína (g)','number',r.prot)+'</div>'
      +'<div class="campo"><label>Itens (um por linha)</label><textarea id="re-itens" rows="4">'+esc(r.itens.join('\n'))+'</textarea></div>'
      +'<div class="campo"><label>Substituições (uma por linha)</label><textarea id="re-subs" rows="3">'+esc((r.subs||[]).join('\n'))+'</textarea></div>'
      +'<div class="acoes"><button class="btn sec-btn" data-action="fechar-modal">cancelar</button>'
      +'<button class="btn" data-action="ref-salvar" data-id="'+esc(r.id)+'">salvar</button></div>');
  },
  'ref-salvar':el=>{
    const r=S.diet.refeicoes.find(x=>x.id===el.dataset.id); if(!r) return;
    r.nome=val('re-nome'); r.hora=val('re-hora');
    r.kcal=Number(val('re-kcal'))||0; r.prot=Number(val('re-prot'))||0;
    r.itens=linhas('re-itens'); r.subs=linhas('re-subs');
    saveState(); fecharModal(); render();
  },
  'ref-add':()=>abrirModal('<h3>Nova refeição</h3>'
    +campo('ra-nome','Nome (ex.: Café da manhã)','text','')+campo('ra-hora','Horário (ex.: 07:00)','text','')
    +'<div class="grid-2">'+campo('ra-kcal','kcal (opcional)','number','')+campo('ra-prot','Proteína g (opcional)','number','')+'</div>'
    +'<div class="campo"><label>Itens (um por linha)</label><textarea id="ra-itens" rows="4" placeholder="ex.: 2 ovos&#10;1 fruta"></textarea></div>'
    +'<div class="acoes"><button class="btn sec-btn" data-action="fechar-modal">cancelar</button>'
    +'<button class="btn" data-action="ref-add-salvar">criar</button></div>'),
  'ref-add-salvar':()=>{
    const nome=val('ra-nome'); if(!nome){ toast('Dá um nome à refeição'); return; }
    S.diet.refeicoes.push({id:'ref'+uid(),nome,hora:val('ra-hora'),kcal:Number(val('ra-kcal'))||0,prot:Number(val('ra-prot'))||0,itens:linhas('ra-itens'),subs:[]});
    saveState(); fecharModal(); render();
  },
  'ref-remover':el=>{ S.diet.refeicoes=S.diet.refeicoes.filter(r=>r.id!==el.dataset.id); saveState(); fecharModal(); render(); },
  'med-add':()=>abrirModal('<h3>Novo grupo de remédios/suplementos</h3>'
    +'<p class="sec small">Agrupe por horário (ex.: “Manhã”, “Antes de dormir”).</p>'
    +campo('ma-nome','Nome do grupo (ex.: Manhã)','text','')
    +'<div class="campo"><label>Itens (um por linha)</label><textarea id="ma-itens" rows="4" placeholder="ex.: Vitamina D&#10;Creatina 3g"></textarea></div>'
    +'<div class="acoes"><button class="btn sec-btn" data-action="fechar-modal">cancelar</button>'
    +'<button class="btn" data-action="med-add-salvar">criar</button></div>'),
  'med-add-salvar':()=>{
    const nome=val('ma-nome'); if(!nome){ toast('Dá um nome ao grupo'); return; }
    S.meds.grupos.push({id:'med'+uid(),nome,itens:linhas('ma-itens')});
    saveState(); fecharModal(); render();
  },

  'peso-add':()=>abrirModal('<h3>Registrar peso</h3>'
    +campo('pe-kg','Peso (kg)','number','')
    +'<div class="acoes"><button class="btn sec-btn" data-action="fechar-modal">cancelar</button>'
    +'<button class="btn" data-action="peso-salvar">salvar</button></div>'),
  'peso-salvar':()=>{
    const kg=Number(String(val('pe-kg')).replace(',','.'));
    if(!kg||kg<30||kg>250){ toast('Peso inválido'); return; }
    S.pesos=S.pesos.filter(p=>p.data!==hojeISO());
    S.pesos.push({data:hojeISO(),kg:Math.round(kg*10)/10});
    S.profile.peso=kg;
    saveState(); fecharModal(); render(); toast('⚖️ registrado');
  },

  'aporte-edit':()=>abrirModal('<h3>Aporte mensal pras dívidas</h3>'
    +'<p class="sec small">Renda garantida: '+fmtBRL(resumoFinanceiro().renda)+'/mês. Sugestão: R$ 600–800 mantém fôlego pro dia a dia.</p>'
    +campo('ap-valor','Valor (R$)','number',S.finance.aporteMensal)
    +'<div class="acoes"><button class="btn sec-btn" data-action="fechar-modal">cancelar</button>'
    +'<button class="btn" data-action="aporte-salvar">salvar</button></div>'),
  'aporte-salvar':()=>{ S.finance.aporteMensal=Math.max(0,Number(String(val('ap-valor')).replace(',','.'))||0); saveState(); fecharModal(); render(); },

  'divida-add':()=>abrirModalDivida(null),
  'divida-edit':el=>abrirModalDivida(el.dataset.id),
  'divida-salvar':el=>{
    const id=el.dataset.id;
    const nome=val('dv-nome'); const total=Number(String(val('dv-total')).replace(',','.'))||0;
    if(!nome||total<=0){ toast('Preenche nome e valor'); return; }
    if(id){ const dv=S.finance.dividas.find(x=>x.id===id); if(dv){ dv.nome=nome; dv.total=total; } }
    else S.finance.dividas.push({id:'dv'+Date.now(),nome,total,pagos:[]});
    saveState(); fecharModal(); render();
  },
  'divida-remover':el=>{
    S.finance.dividas=S.finance.dividas.filter(x=>x.id!==el.dataset.id);
    saveState(); fecharModal(); render();
  },
  'pagar':el=>{
    const dv=S.finance.dividas.find(x=>x.id===el.dataset.id); if(!dv) return;
    abrirModal('<h3>Pagamento — '+esc(dv.nome)+'</h3>'
      +'<p class="sec small">Falta '+fmtBRL(saldoDivida(dv))+'.</p>'
      +campo('pg-valor','Valor pago (R$)','number','')
      +'<div class="acoes"><button class="btn sec-btn" data-action="fechar-modal">cancelar</button>'
      +'<button class="btn" data-action="pagar-salvar" data-id="'+esc(dv.id)+'">registrar 💸</button></div>');
  },
  'pagar-salvar':el=>{
    const dv=S.finance.dividas.find(x=>x.id===el.dataset.id); if(!dv) return;
    const v=Number(String(val('pg-valor')).replace(',','.'));
    if(!v||v<=0){ toast('Valor inválido'); return; }
    dv.pagos.push({id:uid(),valor:round2(v),data:hojeISO()});
    saveState(); fecharModal(); render();
    if(saldoDivida(dv)<=0.005) toast('✂️ '+dv.nome+' QUITADA! Próxima da fila 👊');
    else toast('Pagamento registrado 💸');
  },
  'economia-transferir':()=>{
    const econ=economiaDisponivel();
    if(econ<=0){ toast('Nada pra transferir ainda'); return; }

    let restante=econ; const partes=[];
    for(const dv of S.finance.dividas){
      const s=saldoDivida(dv);
      if(s<=0.005||restante<=0.005) continue;
      const v=Math.min(s,restante);
      dv.pagos.push({id:uid(),valor:round2(v),data:hojeISO(),origem:'apostas'});
      partes.push(dv.nome+' '+fmtBRL(v));
      restante=round2(restante-v);
    }
    const usado=round2(econ-restante);
    if(usado<=0){ toast('Sem dívidas em aberto 🎉'); return; }
    S.finance.extras.push({id:uid(),valor:usado,data:hojeISO(),origem:'apostas'});
    saveState(); render();
    toast('💰 '+fmtBRL(usado)+' de apostas não feitas → '+partes.join(' · '));
  },

  'apostar':()=>abrirModal('<h3>Registrar aposta</h3>'
    +'<p class="sec small">Registrar é coragem, não fracasso. O número entra na semana e a vida segue.</p>'
    +campo('bt-valor','Valor (R$)','number','')
    +'<div class="acoes"><button class="btn sec-btn" data-action="fechar-modal">cancelar</button>'
    +'<button class="btn perigo" data-action="apostar-salvar">registrar</button></div>'
    +'<p class="muted small mt">Se ainda der tempo de não apostar: fecha isso e aperta 🌊.</p>'),
  'apostar-salvar':()=>{
    const v=Number(String(val('bt-valor')).replace(',','.'));
    if(!v||v<=0){ toast('Valor inválido'); return; }
    registrarAposta(Math.round(v*100)/100);
    fecharModal(); render();
  },
  'apostas-reiniciar':()=>{
    S.bets.inicioPlano=hojeISO();
    saveState(); render(); toast('Plano de redução reiniciado a partir de hoje');
  },
  'apostas-ativar':()=>abrirModal('<h3>Ativar plano de redução de apostas</h3>'
    +'<p class="sec small">Quanto você costuma apostar por semana hoje? O limite começa aí e cai até zerar.</p>'
    +campo('at-limite','Limite inicial por semana (R$)','number','')
    +campo('at-semanas','Semanas até zerar','number','8')
    +'<div class="acoes"><button class="btn sec-btn" data-action="fechar-modal">cancelar</button>'
    +'<button class="btn" data-action="apostas-ativar-ok">ativar</button></div>'),
  'apostas-ativar-ok':()=>{
    const lim=Number(String(val('at-limite')).replace(',','.'))||0;
    const sem=Number(val('at-semanas'))||8;
    S.bets.ativo=true; S.bets.limiteSemanaInicial=Math.max(0,lim); S.bets.semanasParaZero=Math.max(1,sem); S.bets.inicioPlano=hojeISO();
    saveState(); fecharModal(); render(); toast('Plano ativado — um passo de cada vez 💪');
  },

  'burnout-abrir':()=>{
    const Q=['Me sinto esgotado mesmo depois de dormir','Ando irritado ou impaciente com todo mundo',
      'As coisas que eu gostava perderam a graça','Estou dormindo mal ou adiando a hora de dormir',
      'Sinto que não dou conta da semana'];
    abrirModal('<h3>Radar de burnout</h3><p class="sec small">Pensando na última semana:</p>'
      +Q.map((q,i)=>'<div class="campo"><label>'+esc(q)+'</label><select id="bo-'+i+'">'
        +'<option value="0">quase nunca</option><option value="1">às vezes</option><option value="2">direto</option></select></div>').join('')
      +'<div class="acoes"><button class="btn sec-btn" data-action="fechar-modal">cancelar</button>'
      +'<button class="btn" data-action="burnout-salvar">ver resultado</button></div>');
  },
  'burnout-salvar':()=>{
    let score=0; for(let i=0;i<5;i++) score+=Number(val('bo-'+i))||0;
    getDia().burnout={score};
    saveState(); fecharModal(); UI.tab='mente'; render();
    toast(score<=3?'🟢 Radar verde — bora':score<=6?'🟡 Amarelo — pega leve essa semana':'🔴 Vermelho — reduz a carga, tá combinado?');
  },

  'habito-add':()=>abrirModalHabito(null),
  'habito-edit':el=>abrirModalHabito(el.dataset.id),
  'habito-salvar':el=>{
    const id=el.dataset.id;
    const nome=val('hb-nome'); if(!nome){ toast('Dá um nome'); return; }
    const dias=[0,1,2,3,4,5,6].filter(i=>document.getElementById('hb-d'+i).checked);
    const dados={nome,icone:val('hb-icone')||'⭐',tipo:val('hb-tipo'),dias:dias.length?dias:[0,1,2,3,4,5,6],xp:Number(val('hb-xp'))||10};
    if(id){ const hb=S.habits.find(x=>x.id===id); if(hb) Object.assign(hb,dados); }
    else S.habits.push({id:'hb'+Date.now(),...dados});
    saveState(); fecharModal(); render();
  },
  'habito-del':el=>{
    if(el.dataset.id==='apostas'){ toast('Esse hábito é ligado ao plano de apostas da aba Grana — edita em vez de excluir 😉'); return; }
    const hb=S.habits.find(x=>x.id===el.dataset.id);
    abrirModal('<h3>Excluir “'+esc(hb?hb.nome:'')+'”?</h3><p class="sec small">O histórico dos dias fica guardado, mas o hábito some da lista. (Obs.: conquistas ligadas a hábitos padrão param de progredir se eles forem excluídos.)</p>'
      +'<div class="acoes"><button class="btn sec-btn" data-action="fechar-modal">cancelar</button>'
      +'<button class="btn perigo" data-action="habito-del-confirma" data-id="'+esc(el.dataset.id)+'">excluir</button></div>');
  },
  'habito-del-confirma':el=>{
    S.habits=S.habits.filter(x=>x.id!==el.dataset.id);
    saveState(); fecharModal(); render();
  },

  'renda-add':()=>abrirModalRenda(null),
  'renda-edit':el=>abrirModalRenda(Number(el.dataset.ix)),
  'renda-salvar':el=>{
    const ix=el.dataset.ix===''?null:Number(el.dataset.ix);
    const r={nome:val('rd-nome')||'Renda',valor:Number(String(val('rd-valor')).replace(',','.'))||0};
    if(ix===null) S.finance.rendas.push(r); else S.finance.rendas[ix]=r;
    saveState(); fecharModal(); render();
  },
  'renda-remover':el=>{
    const ix=Number(el.dataset.ix);
    S.finance.rendas.splice(ix,1);
    saveState(); fecharModal(); render();
  },

  'sync-agora':async()=>{
    if(!syncConfigurado()){ toast('Preenche URL, chave e código primeiro'); return; }
    toast('Sincronizando…');
    try{ await syncAgora(); render(); toast('✅ Sincronizado'); }
    catch(e){ toast('❌ '+e.message); }
  },
  'sync-baixar':async()=>{
    if(!syncConfigurado()){ toast('Preenche URL, chave e código primeiro'); return; }
    toast('Baixando…');
    try{ const ok=await syncPull(); render(); toast(ok?'✅ Dados baixados e mesclados':'Nada na nuvem ainda — usa “sincronizar agora”'); }
    catch(e){ toast('❌ '+e.message); }
  },

  'exportar':()=>{
    const blob=new Blob([JSON.stringify(S,null,1)],{type:'application/json'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='constante-backup-'+hojeISO()+'.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href),4000);
  },
  'importar':()=>document.getElementById('importar-arquivo').click(),
  'zerar':()=>abrirModal('<h3>Apagar tudo?</h3><p class="sec small">Todo o histórico some deste aparelho. Faz um backup antes, vai por mim.</p>'
    +'<div class="acoes"><button class="btn sec-btn" data-action="fechar-modal">cancelar</button>'
    +'<button class="btn perigo" data-action="zerar-confirma">apagar tudo</button></div>'),
  'zerar-confirma':()=>{ S=defaultState(); saveState({skipSync:true}); fecharModal(); render(); toast('Recomeço. Bora 🌱'); },

  'auth-tela':el=>{
    UI.auth={tela:el.dataset.t,email:val('au-email')||(UI.auth&&UI.auth.email)||''};
    renderLogin();
  },
  'auth-entrar':async()=>{
    const email=val('au-email');
    const senha=(document.getElementById('au-senha')||{}).value||'';
    if(!email||!senha){ UI.auth.erro='Preenche e-mail e senha.'; UI.auth.msg=''; renderLogin(); return; }
    UI.auth.email=email; UI.auth.erro=''; UI.auth.msg='Entrando…'; renderLogin();
    try{ await authEntrar(email,senha);  }
    catch(e){ UI.auth.msg=''; UI.auth.erro=e.message; renderLogin(); }
  },
  'auth-cadastrar':async()=>{
    const email=val('au-email');
    const s1=(document.getElementById('au-senha')||{}).value||'';
    const s2=(document.getElementById('au-senha2')||{}).value||'';
    const consent=(document.getElementById('au-consent')||{}).checked;
    UI.auth.email=email; UI.auth.msg='';
    if(!email){ UI.auth.erro='Preenche teu e-mail.'; renderLogin(); return; }
    if(s1.length<6){ UI.auth.erro='A senha precisa ter pelo menos 6 caracteres.'; renderLogin(); return; }
    if(s1!==s2){ UI.auth.erro='As senhas não batem.'; renderLogin(); return; }
    if(!consent){ UI.auth.erro='Pra criar a conta, precisa aceitar a Política de Privacidade (LGPD).'; renderLogin(); return; }
    UI.auth.erro=''; UI.auth.msg='Criando conta…'; renderLogin();
    try{
      const data=await authCadastrar(email,s1);
      if(!data.session){ UI.auth={tela:'confirmar',email}; renderLogin(); }

    }catch(e){ UI.auth.msg=''; UI.auth.erro=e.message; renderLogin(); }
  },
  'auth-esqueci-enviar':async()=>{
    const email=val('au-email');
    if(!email){ UI.auth.erro='Digita teu e-mail.'; UI.auth.msg=''; renderLogin(); return; }
    UI.auth.email=email; UI.auth.erro=''; UI.auth.msg='Enviando…'; renderLogin();
    try{ await authRecuperarSenha(email); UI.auth={tela:'entrar',email,msg:'Link enviado! Abre teu e-mail (e o spam) e clica nele.'}; }
    catch(e){ UI.auth.msg=''; UI.auth.erro=e.message; }
    renderLogin();
  },
  'auth-reenviar':async()=>{
    try{ await authReenviarConfirmacao(UI.auth.email); UI.auth.msg='Reenviado! Confere o spam também.'; UI.auth.erro=''; }
    catch(e){ UI.auth.erro=e.message; UI.auth.msg=''; }
    renderLogin();
  },
  'auth-nova-senha-salvar':async()=>{
    const s1=(document.getElementById('au-senha')||{}).value||'';
    const s2=(document.getElementById('au-senha2')||{}).value||'';
    if(s1.length<6){ UI.auth.erro='Mínimo 6 caracteres.'; renderLogin(); return; }
    if(s1!==s2){ UI.auth.erro='As senhas não batem.'; renderLogin(); return; }
    try{
      await authTrocarSenha(s1);
      _emRecuperacao=false;
      const u=usuarioAtual(); if(u) carregarEstadoDaConta(u);
      toast('🔒 Senha nova salva'); sairModoLogin(); renderSeguro(); sincronizarPosLogin();
    }
    catch(e){ UI.auth.erro=e.message; renderLogin(); }
  },
  'auth-sair':()=>{
    abrirModal('<h3>Sair da conta?</h3><p class="sec small">Teus dados continuam na nuvem e também neste aparelho.</p>'
      +'<div class="acoes"><button class="btn sec-btn" data-action="fechar-modal">ficar</button>'
      +'<button class="btn" data-action="auth-sair-confirma">sair</button></div>');
  },
  'auth-sair-confirma':async()=>{ fecharModal(); await flushSyncPendente(); await authSair();  },
  'conta-trocar-senha':()=>{
    abrirModal('<h3>Trocar senha</h3>'
      +campo('cs-s1','Nova senha (mín. 6)','password','')
      +campo('cs-s2','Repete a nova senha','password','')
      +'<div class="acoes"><button class="btn sec-btn" data-action="fechar-modal">cancelar</button>'
      +'<button class="btn" data-action="conta-trocar-senha-salvar">salvar</button></div>');
  },
  'conta-trocar-senha-salvar':async()=>{
    const s1=(document.getElementById('cs-s1')||{}).value||'';
    const s2=(document.getElementById('cs-s2')||{}).value||'';
    if(s1.length<6){ toast('Mínimo 6 caracteres'); return; }
    if(s1!==s2){ toast('As senhas não batem'); return; }
    try{ await authTrocarSenha(s1); fecharModal(); render(); toast('🔒 Senha trocada'); }
    catch(e){ toast('❌ '+e.message); }
  },
  'conta-apagar':()=>{
    abrirModal('<h3>Apagar sua conta?</h3>'
      +'<p class="sec small">Remove <b>pra sempre</b> sua conta e todos os seus dados do servidor (LGPD). Não tem volta. Se quiser guardar algo, usa "exportar backup" antes.</p>'
      +'<div class="acoes"><button class="btn sec-btn" data-action="fechar-modal">cancelar</button>'
      +'<button class="btn perigo" data-action="conta-apagar-confirma">apagar minha conta</button></div>');
  },
  'conta-apagar-confirma':async()=>{
    fecharModal(); toast('Apagando…');
    try{
      await authApagarConta();
      S=defaultState(); saveState({skipSync:true});
      toast('Conta apagada. Cuida de ti 💜');
    }catch(e){ toast('❌ '+e.message); }
  },

  'voltar-sub':()=>{ UI.sub=null; render(); window.scrollTo({top:0}); },
  'abrir-treino':el=>{ UI.tab='rotina'; UI.sub={tipo:'treino',id:el.dataset.id}; render(); window.scrollTo({top:0}); },
  'abrir-caderno':el=>{ UI.tab='rotina'; UI.sub={tipo:'caderno',id:el.dataset.id}; render(); window.scrollTo({top:0}); },

  'ex-add':el=>{
    const idT=el.dataset.t;
    abrirModal('<h3>Novo exercício</h3>'
      +campo('ex-nome','Nome do exercício (ex.: Supino reto)','text','')
      +'<div class="acoes"><button class="btn sec-btn" data-action="fechar-modal">cancelar</button>'
      +'<button class="btn" data-action="ex-salvar" data-t="'+esc(idT)+'">adicionar</button></div>');
  },
  'ex-salvar':el=>{
    const nome=val('ex-nome'); if(!nome){ toast('Dá um nome ao exercício'); return; }
    addExercicio(el.dataset.t,nome); fecharModal(); render();
  },
  'ex-remover':el=>{
    abrirModal('<h3>Remover exercício?</h3><p class="sec small">O histórico de cargas dele some junto.</p>'
      +'<div class="acoes"><button class="btn sec-btn" data-action="fechar-modal">cancelar</button>'
      +'<button class="btn perigo" data-action="ex-remover-ok" data-t="'+esc(el.dataset.t)+'" data-e="'+esc(el.dataset.e)+'">remover</button></div>');
  },
  'ex-remover-ok':el=>{ removerExercicio(el.dataset.t,el.dataset.e); fecharModal(); render(); },
  'carga-add':el=>{
    const t=treinoPorId(el.dataset.t); const ex=t&&t.exercicios.find(x=>x.id===el.dataset.e);
    const ult=ex&&ultimoRegistro(ex);
    abrirModal('<h3>Registrar série — '+esc(ex?ex.nome:'')+'</h3>'
      +(ult?'<p class="sec small">Última vez: '+ult.series+'×'+ult.reps+' · '+String(ult.carga).replace('.',',')+' kg</p>':'')
      +'<div class="grid-2">'+campo('cg-series','Séries','number',ult?ult.series:3)+campo('cg-reps','Repetições','number',ult?ult.reps:10)+'</div>'
      +campo('cg-carga','Carga (kg)','number',ult?ult.carga:'')
      +'<div class="acoes"><button class="btn sec-btn" data-action="fechar-modal">cancelar</button>'
      +'<button class="btn" data-action="carga-salvar" data-t="'+esc(el.dataset.t)+'" data-e="'+esc(el.dataset.e)+'">salvar</button></div>');
  },
  'carga-salvar':el=>{
    registrarCarga(el.dataset.t,el.dataset.e,val('cg-series'),val('cg-reps'),val('cg-carga'));
    fecharModal(); render(); toast('💪 registrado');
  },

  'gasto-add':()=>{
    const cats=S.gastos.categorias.map(c=>'<option value="'+esc(c.id)+'">'+esc(c.icone+' '+c.nome)+'</option>').join('');
    abrirModal('<h3>Registrar gasto</h3>'
      +campo('ga-valor','Valor (R$)','number','')
      +'<div class="campo"><label>Categoria</label><select id="ga-cat">'+cats+'</select></div>'
      +campo('ga-desc','Descrição (ex.: uber, cantina)','text','')
      +'<div class="acoes"><button class="btn sec-btn" data-action="fechar-modal">cancelar</button>'
      +'<button class="btn" data-action="gasto-salvar">registrar</button></div>'
      +'<p class="muted small mt"><button class="deslize-btn" data-action="gasto-nova-cat">+ criar categoria</button></p>');
  },
  'gasto-salvar':()=>{
    const v=Number(String(val('ga-valor')).replace(',','.'));
    if(!v||v<=0){ toast('Valor inválido'); return; }
    addGasto(v,val('ga-cat'),val('ga-desc'),hojeISO());
    fecharModal(); render(); toast('Gasto registrado');
  },
  'gasto-nova-cat':()=>{
    abrirModal('<h3>Nova categoria</h3>'
      +'<div class="grid-2">'+campo('nc-icone','Ícone (emoji)','text','📦')+campo('nc-nome','Nome','text','')+'</div>'
      +'<div class="acoes"><button class="btn sec-btn" data-action="gasto-add">← voltar</button>'
      +'<button class="btn" data-action="gasto-nova-cat-ok">criar</button></div>');
  },
  'gasto-nova-cat-ok':()=>{
    const nome=val('nc-nome'); if(!nome){ toast('Dá um nome'); return; }
    addCategoriaGasto(nome,val('nc-icone')); ACOES['gasto-add']();
  },
  'gasto-remover':el=>{ removerGasto(el.dataset.id); render(); },

  'caderno-add':()=>abrirModal('<h3>Novo caderno de estudo</h3>'
    +campo('cad-nome','Tema (ex.: Cálculo, Violão, Inglês…)','text','')
    +'<div class="acoes"><button class="btn sec-btn" data-action="fechar-modal">cancelar</button>'
    +'<button class="btn" data-action="caderno-salvar">criar</button></div>'),
  'caderno-salvar':()=>{
    const nome=val('cad-nome'); if(!nome){ toast('Dá um nome ao tema'); return; }
    const c=addCaderno(nome); fecharModal();
    if(c){ UI.tab='rotina'; UI.sub={tipo:'caderno',id:c.id}; }
    render();
  },
  'caderno-remover':el=>{
    abrirModal('<h3>Excluir caderno?</h3><p class="sec small">Todas as anotações dele somem.</p>'
      +'<div class="acoes"><button class="btn sec-btn" data-action="fechar-modal">cancelar</button>'
      +'<button class="btn perigo" data-action="caderno-remover-ok" data-id="'+esc(el.dataset.id)+'">excluir</button></div>');
  },
  'caderno-remover-ok':el=>{ removerCaderno(el.dataset.id); fecharModal(); UI.sub=null; render(); },
  'nota-salvar':el=>{
    const texto=(document.getElementById('nota-nova')||{}).value||'';
    if(!texto.trim()){ toast('Escreve algo primeiro'); return; }
    addNota(el.dataset.id,texto); render(); toast('📝 anotado');
  },
  'nota-remover':el=>{ removerNota(el.dataset.c,el.dataset.n); render(); },

  'nome-salvar':()=>{
    const n=val('nome-novo'); if(!n){ toast('Escreve um nome ou apelido'); return; }
    S.profile.nome=n; saveState(); fecharModal(); render();
    setTimeout(()=>toast(saudacaoHora()+', '+n+'! Bem-vindo ao Constante 👋'),300);
  },
  'nome-pular':()=>{ fecharModal(); },

  'assist-abrir':()=>abrirAssistente(),
  'assist-foto':()=>{ const f=document.getElementById('assist-file'); if(f) f.click(); },
  'assist-remimg':el=>{ _assistImgs.splice(Number(el.dataset.ix),1); const r=document.querySelector('.modal'); if(r) r.innerHTML=assistenteHTML(); },
  'assist-enviar':()=>enviarAssistente(),
  'assist-aplicar':()=>{
    aplicarPlano(_planoPendente); _planoPendente=null;
    fecharModal(); UI.tab='rotina'; render();
    toast('✨ Rotina montada! Dá uma olhada e ajusta o que quiser.');
  }
};

function pedirNome(){
  abrirModal('<h3>👋 Como você quer ser chamado(a)?</h3>'
    +'<p class="sec small">É assim que o Constante vai te cumprimentar todo dia.</p>'
    +campo('nome-novo','Seu nome ou apelido','text','')
    +'<div class="acoes"><button class="btn sec-btn" data-action="nome-pular">agora não</button>'
    +'<button class="btn" data-action="nome-salvar">pronto</button></div>');
}
function boasVindas(){
  const nome=(S.profile.nome||'').trim();
  if(!nome){ setTimeout(pedirNome,500); return; }
  const ult=S.settings.ultimaVisita;
  S.settings.ultimaVisita=hojeISO();
  saveState({skipSync:true});
  if(ult && diffDias(ult,hojeISO())<=0) return;
  let msg;
  if(!ult) msg=saudacaoHora()+', '+nome+'! 👋';
  else{
    const dd=diffDias(ult,hojeISO());
    if(dd===1) msg='Bom te ver de novo, '+nome+'! 👋';
    else if(dd<7) msg='Que bom que você voltou, '+nome+'! 💜';
    else msg='Senti sua falta, '+nome+'! Bora retomar 🚀';
  }
  setTimeout(()=>toast(msg),600);
}

function nomeHabito(id){ const h=S.habits.find(x=>x.id===id); return h?h.nome:id; }
function val(id){ const el=document.getElementById(id); return el?el.value.trim():''; }
function linhas(id){ return val(id).split('\n').map(s=>s.trim()).filter(Boolean); }
function campo(id,rotulo,tipo,valor){

  const t=tipo==='number'?'text':tipo;
  return '<div class="campo"><label>'+esc(rotulo)+'</label><input id="'+id+'" type="'+t+'" value="'+esc(valor)+'"'+(tipo==='number'?' inputmode="decimal"':'')+'></div>';
}

function abrirModalBloco(d,ix){
  const b=ix!=null?blocosDoDia(d)[ix]:null;
  const tipos=Object.keys(TIPO_LABEL).map(t=>'<option value="'+t+'" '+(b&&b.tipo===t?'selected':'')+'>'+TIPO_LABEL[t]+'</option>').join('');
  abrirModal('<h3>'+(b?'Editar':'Novo')+' bloco — '+DIAS_NOME[d]+'</h3>'
    +'<div class="grid-2">'+campo('bl-ini','Início','time',b?b.i:'')+campo('bl-fim','Fim (vazio = marco)','time',b&&b.f?b.f:'')+'</div>'
    +campo('bl-titulo','Título','text',b?b.t:'')
    +'<div class="campo"><label>Tipo</label><select id="bl-tipo">'+tipos+'</select></div>'
    +'<div class="acoes">'
    +(b?'<button class="btn perigo" data-action="bloco-remover" data-d="'+d+'" data-ix="'+ix+'">remover</button>':'')
    +'<button class="btn sec-btn" data-action="fechar-modal">cancelar</button>'
    +'<button class="btn" data-action="bloco-salvar" data-d="'+d+'" data-ix="'+(ix!=null?ix:'')+'">salvar</button></div>');
}
function abrirModalDivida(id){
  const dv=id?S.finance.dividas.find(x=>x.id===id):null;
  abrirModal('<h3>'+(dv?'Editar':'Nova')+' dívida</h3>'
    +campo('dv-nome','Pra quem','text',dv?dv.nome:'')
    +campo('dv-total','Valor total (R$)','number',dv?dv.total:'')
    +'<div class="acoes">'
    +(dv?'<button class="btn perigo" data-action="divida-remover" data-id="'+esc(dv.id)+'">remover</button>':'')
    +'<button class="btn sec-btn" data-action="fechar-modal">cancelar</button>'
    +'<button class="btn" data-action="divida-salvar" data-id="'+(dv?dv.id:'')+'">salvar</button></div>');
}
function abrirModalHabito(id){
  const hb=id?S.habits.find(x=>x.id===id):null;
  const dias=[1,2,3,4,5,6,0].map(i=>'<label class="chip" style="cursor:pointer"><input type="checkbox" id="hb-d'+i+'" style="width:auto" '+(!hb||hb.dias.includes(i)?'checked':'')+'> '+DIAS_ABREV[i]+'</label>').join(' ');
  abrirModal('<h3>'+(hb?'Editar':'Novo')+' hábito</h3>'
    +campo('hb-nome','Nome','text',hb?hb.nome:'')
    +'<div class="grid-2">'+campo('hb-icone','Ícone (emoji)','text',hb?hb.icone:'⭐')+campo('hb-xp','XP','number',hb?hb.xp:10)+'</div>'
    +'<div class="campo"><label>Tipo</label><select id="hb-tipo">'
    +'<option value="fazer" '+(!hb||hb.tipo==='fazer'?'selected':'')+'>fazer (marco quando fizer)</option>'
    +'<option value="evitar" '+(hb&&hb.tipo==='evitar'?'selected':'')+'>evitar (marco se vencer o dia)</option></select></div>'
    +'<div class="campo"><label>Dias</label><div style="display:flex;flex-wrap:wrap;gap:0.3rem">'+dias+'</div></div>'
    +'<div class="acoes"><button class="btn sec-btn" data-action="fechar-modal">cancelar</button>'
    +'<button class="btn" data-action="habito-salvar" data-id="'+(hb?hb.id:'')+'">salvar</button></div>');
}
function abrirModalRenda(ix){
  const r=ix!=null?S.finance.rendas[ix]:null;
  abrirModal('<h3>'+(r?'Editar':'Nova')+' renda</h3>'
    +campo('rd-nome','Origem','text',r?r.nome:'')
    +campo('rd-valor','Valor mensal (R$)','number',r?r.valor:'')
    +'<div class="acoes">'
    +(r?'<button class="btn perigo" data-action="renda-remover" data-ix="'+ix+'">remover</button>':'')
    +'<button class="btn sec-btn" data-action="fechar-modal">cancelar</button>'
    +'<button class="btn" data-action="renda-salvar" data-ix="'+(ix!=null?ix:'')+'">salvar</button></div>');
}

function ligarEventos(){
  const ehCampo=el=>el&&/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)&&el.type!=='checkbox'&&el.type!=='radio';
  const noCelular=()=>matchMedia('(max-width:767px), (pointer:coarse)').matches;
  document.addEventListener('focusin',ev=>{ if(noCelular()&&ehCampo(ev.target)) document.body.classList.add('teclado-aberto'); });
  document.addEventListener('focusout',ev=>{ if(ehCampo(ev.target)) setTimeout(()=>{
    if(!ehCampo(document.activeElement)) document.body.classList.remove('teclado-aberto');
  },100); });

  document.body.addEventListener('click',ev=>{
    const nav=ev.target.closest('[data-nav]');
    if(nav){
      if(document.body.classList.contains('modo-login')) return;
      UI.tab=nav.dataset.nav; render(); window.scrollTo({top:0}); return;
    }
    const alvo=ev.target.closest('[data-action]');
    if(!alvo) return;
    const acao=alvo.dataset.action;
    if(acao==='fechar-modal-fundo'){ if(ev.target===alvo){ fecharModal(); render(); } return; }
    if(ACOES[acao]) ACOES[acao](alvo);
  });

  document.body.addEventListener('change',ev=>{
    const t=ev.target;
    if(t.dataset.sono!==undefined&&t.dataset.sono!==''){
      const d=getDia();
      d.sono[t.dataset.sono]=t.type==='number'?(t.value===''?null:Number(String(t.value).replace(',','.'))):t.value;
      if(d.sono.deitou&&d.sono.acordou&&(d.sono.h==null||d.sono.h==='')){
        d.sono.h=horasEntre(d.sono.deitou,d.sono.acordou);
      }
      recalcXP(hojeISO()); saveState(); renderTopbar();
      return;
    }
    if(t.dataset.campo==='nota'){ getDia().nota=t.value; saveState(); return; }
    if(t.dataset.cfg){ setPath(S,t.dataset.cfg,t.value); saveState(); renderTopbar(); return; }
    if(t.dataset.cfgCheck){ setPath(S,t.dataset.cfgCheck,t.checked); saveState(); return; }
    if(t.id==='assist-file'&&t.files&&t.files[0]){
      const arq=t.files[0]; t.value='';
      if(_assistImgs.length>=3){ assistStatus('Máximo de 3 fotos.',true); return; }
      assistStatus('Carregando foto…');
      lerImagemReduzida(arq).then(im=>{
        _assistImgs.push(im);
        const r=document.querySelector('.modal'); if(r) r.innerHTML=assistenteHTML();
      }).catch(e=>assistStatus('❌ '+e.message,true));
      return;
    }
    if(t.id==='importar-arquivo'&&t.files&&t.files[0]){
      const fr=new FileReader();
      fr.onload=()=>{
        try{
          const dados=JSON.parse(fr.result);
          if(!dados||typeof dados!=='object'||Array.isArray(dados)) throw new Error('formato');
          if(dados.days&&(typeof dados.days!=='object'||Array.isArray(dados.days))) throw new Error('formato');
          S=deepFill(dados,defaultState());
          sanearEstado();
          Object.keys(S.days).forEach(recalcXPQuiet);
          saveState(); render(); toast('✅ Backup importado');
        }catch(e){ toast('❌ Arquivo de backup inválido — nada foi alterado'); loadState(); }
      };
      fr.readAsText(t.files[0]);
      t.value='';
    }
  });
}

function renderSeguro(){
  try{ render(); }
  catch(e){
    document.getElementById('view').innerHTML=
      '<section class="card"><h2>Ops</h2><p class="sec">Deu erro ao carregar os dados ('+esc(e.message)+').</p>'
      +'<button class="btn perigo mt" data-action="zerar">apagar dados e recomeçar</button></section>';
  }
}
let _emRecuperacao=false;
let _usuarioLogado=null;

function sincronizarPosLogin(){
  syncAgora()
    .then(()=>{ if(!document.body.classList.contains('modo-login')) render(); })
    .catch(e=>toast('⚠️ '+e.message));
}

function carregarEstadoDaConta(u){
  const donoSalvo=lsDonoGet();
  if(donoSalvo && donoSalvo!==u.id){

    S=defaultState(); lsSet(JSON.stringify(S));
  }
  lsDonoSet(u.id);
  _usuarioLogado=u.id;
}
function aoMudarAuth(evento,sessao,antes){
  if(evento==='PASSWORD_RECOVERY'){ _emRecuperacao=true; UI.auth={tela:'nova-senha'}; renderLogin(); return; }
  if(evento==='SIGNED_IN'&&!antes){
    if(_emRecuperacao) return;
    carregarEstadoDaConta(sessao.user);
    sairModoLogin(); renderSeguro();
    sincronizarPosLogin();
    boasVindas();
    return;
  }
  if(evento==='SIGNED_OUT'){

    S=defaultState(); lsSet(JSON.stringify(S)); lsDonoSet(null);
    _usuarioLogado=null; _emRecuperacao=false;
    UI.auth={tela:'entrar'}; renderLogin();
  }
}
function boot(){
  loadState();
  ligarEventos();
  if(typeof modoProduto==='function'&&modoProduto()){

    if(/type=recovery/.test(location.hash)||/type=recovery/.test(location.search)) _emRecuperacao=true;
    initAuth(aoMudarAuth).then(sessao=>{
      if(_emRecuperacao){ if(!UI.auth) UI.auth={tela:'nova-senha'}; renderLogin(); return; }
      if(sessao){ carregarEstadoDaConta(sessao.user); renderSeguro(); sincronizarPosLogin(); boasVindas(); }
      else renderLogin();
    });
  } else {
    renderSeguro();
    boasVindas();
    if(S.settings.syncAuto&&syncConfigurado()){
      syncPull().then(ok=>{ if(ok) render(); }).catch(()=>{});
    }
  }
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  }

  let ultimoPullFoco=0;
  const podeMexerNaTela=()=>{
    const foco=document.activeElement&&['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName);
    const modalAberto=document.getElementById('modal-root').innerHTML!=='';
    return !foco&&!modalAberto;
  };
  const pullAoVoltar=()=>{
    if(document.visibilityState!=='visible') return;
    if(!(S.settings.syncAuto&&syncConfigurado()&&S.settings.ultimaSync)) return;
    const agora=Date.now();
    if(agora-ultimoPullFoco<20000) return;
    ultimoPullFoco=agora;
    syncPull().then(ok=>{ if(ok&&podeMexerNaTela()) render(); }).catch(()=>{});
  };
  document.addEventListener('visibilitychange',pullAoVoltar);
  window.addEventListener('focus',pullAoVoltar);

  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='hidden'&&S.settings.syncAuto&&syncConfigurado()&&S.settings.ultimaSync){
      clearTimeout(_saveTimer);
      syncPush({flush:true}).catch(()=>{});
    }
  });

  setInterval(()=>{
    if(document.body.classList.contains('modo-login')) return;
    pullAoVoltar();
    if(podeMexerNaTela()&&(UI.tab==='hoje'||UI.tab==='rotina')) render();
  },60000);
}
document.addEventListener('DOMContentLoaded',boot);
