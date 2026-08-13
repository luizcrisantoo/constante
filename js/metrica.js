'use strict';
// ============================================================
// MÉTRICAS DE USO — anônimas e sem conteúdo (LGPD-friendly).
// Só sai daqui o NOME do evento (ex.: "agua", "habit", "tab:hoje")
// — nunca valores, textos, e-mail ou qualquer dado de saúde.
// Fica DORMANTE até existir CONSTANTE_CONFIG.posthogKey (PostHog).
// Pra ativar: cria um projeto no PostHog (região UE), copia a chave
// "phc_..." e adiciona em js/config.js:  posthogKey: 'phc_...'
// ============================================================

let _mUid=null;

function metricaAtiva(){
  return typeof CONSTANTE_CONFIG!=='undefined' && !!CONSTANTE_CONFIG.posthogKey;
}
function metricaIdentificar(id){ _mUid=id?String(id):null; }

function _mAnonId(){
  try{
    let v=localStorage.getItem('constante_mid');
    if(!v){ v='anon-'+Date.now().toString(36)+Math.random().toString(36).slice(2,10); localStorage.setItem('constante_mid',v); }
    return v;
  }catch(e){ return 'anon-sem-storage'; }
}

// Ações que não valem evento (ruído) — nomes apenas, nunca há valores.
const _mIgnorar=new Set(['fechar-modal','fechar-modal-fundo','ver-senha']);

function metrica(evento){
  if(!metricaAtiva()) return;
  if(!evento||_mIgnorar.has(evento)) return;
  const host=(CONSTANTE_CONFIG.posthogHost||'https://eu.i.posthog.com').replace(/\/+$/,'');
  const corpo=JSON.stringify({
    api_key:CONSTANTE_CONFIG.posthogKey,
    event:String(evento).slice(0,60),
    distinct_id:_mUid||_mAnonId(),
    properties:{ $process_person_profile:false, versao:(typeof versaoApp==='function')?versaoApp():0 },
    timestamp:new Date().toISOString()
  });
  try{
    if(navigator.sendBeacon){
      navigator.sendBeacon(host+'/i/v0/e/', new Blob([corpo],{type:'application/json'}));
    } else {
      fetch(host+'/i/v0/e/',{method:'POST',headers:{'Content-Type':'application/json'},body:corpo,keepalive:true}).catch(()=>{});
    }
  }catch(e){}
}
