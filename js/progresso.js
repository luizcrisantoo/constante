'use strict';

let _fotoUrls = {};
let _fotoCompareModo = false;
let _fotoCompare = [];

function progressoDisponivel(){
  return typeof produtoAtivo==='function' && produtoAtivo() && typeof clienteSB==='function' && clienteSB();
}

// Apaga TODAS as fotos do usuário no cofre (Storage API) — usado ao apagar a conta.
async function apagarFotosDoUsuario(){
  if(!progressoDisponivel()) return;
  const u=(typeof usuarioAtual==='function')?usuarioAtual():null;
  if(!u) return;
  const sb=clienteSB();
  try{
    const {data,error}=await sb.storage.from('progresso').list(u.id,{limit:1000});
    if(error||!Array.isArray(data)||!data.length) return;
    const paths=data.filter(o=>o&&o.name).map(o=>u.id+'/'+o.name);
    if(paths.length) await sb.storage.from('progresso').remove(paths);
  }catch(e){}
}

function reduzirParaBlob(file, max, q){
  return new Promise((resolve,reject)=>{
    if(!file || !/^image\//.test(file.type)){ reject(new Error('arquivo não é imagem')); return; }
    const img=new Image();
    const fr=new FileReader();
    fr.onload=()=>{ img.src=fr.result; };
    fr.onerror=()=>reject(new Error('falha ao ler'));
    img.onload=()=>{
      let w=img.width, h=img.height;
      if(w>max||h>max){ const r=Math.min(max/w,max/h); w=Math.round(w*r); h=Math.round(h*r); }
      const cv=document.createElement('canvas'); cv.width=w; cv.height=h;
      cv.getContext('2d').drawImage(img,0,0,w,h);
      cv.toBlob(b=>{ b?resolve(b):reject(new Error('falha ao processar')); },'image/jpeg',q||0.85);
    };
    img.onerror=()=>reject(new Error('imagem inválida'));
    fr.readAsDataURL(file);
  });
}

async function subirFoto(file){
  const u=(typeof usuarioAtual==='function')?usuarioAtual():null;
  if(!u||!progressoDisponivel()){ toast('Entre na conta pra guardar fotos'); return; }
  toast('Enviando foto…');
  try{
    const blob=await reduzirParaBlob(file, 1280, 0.85);
    const id='pf'+uid();
    const path=u.id+'/'+id+'.jpg';
    const {error}=await clienteSB().storage.from('progresso').upload(path, blob, {contentType:'image/jpeg', upsert:false});
    if(error) throw new Error(error.message||'falha no upload');
    if(!Array.isArray(S.progresso)) S.progresso=[];
    S.progresso.push({id, path, data:hojeISO(), nota:''});
    saveState(); render(); toast('📷 Foto adicionada!');
  }catch(e){ toast('❌ '+e.message); }
}

async function hidratarFotos(){
  if(!progressoDisponivel()) return;
  const imgs=document.querySelectorAll('img[data-path]');
  for(const el of imgs){
    if(el.dataset.hidratado) continue;
    const path=el.dataset.path;
    try{
      let url=_fotoUrls[path];
      if(!url){
        const {data,error}=await clienteSB().storage.from('progresso').createSignedUrl(path, 3600);
        if(error||!data||!data.signedUrl) continue;
        url=data.signedUrl; _fotoUrls[path]=url;
      }
      el.src=url; el.dataset.hidratado='1';
    }catch(e){}
  }
}

function fmtDataCurta(iso){
  if(!iso) return '';
  const p=String(iso).split('-');
  return p.length===3?(p[2]+'/'+p[1]):String(iso);
}

function viewProgresso(){
  const fotos=(S.progresso||[]).slice().sort((a,b)=>String(b.data||'').localeCompare(String(a.data||'')));
  let html='<section class="card">'
    +'<h2>Progresso em fotos</h2>'
    +'<p class="sec small">Suas fotos ficam privadas — só você vê. Registre de vez em quando e compare a evolução.</p>'
    +'<button class="btn mt" data-action="foto-add">📷 adicionar foto</button>'
    +'<input type="file" id="foto-file" accept="image/*" class="escondido"></section>';

  if(!fotos.length){
    html+='<section class="card"><p class="muted small">Nenhuma foto ainda. Quando você adicionar, elas aparecem aqui da mais nova pra mais antiga.</p></section>';
    return html;
  }

  if(_fotoCompare.length===2){
    const a=S.progresso.find(f=>f.id===_fotoCompare[0]);
    const b=S.progresso.find(f=>f.id===_fotoCompare[1]);
    if(a&&b){
      html+='<section class="card"><div class="linha"><h2>Comparando</h2>'
        +'<button class="btn mini sec-btn" data-action="foto-comparar-limpar">limpar</button></div>'
        +'<div style="display:flex;gap:6px;margin-top:8px">'
        +'<div style="flex:1"><img data-path="'+esc(a.path)+'" style="width:100%;border-radius:8px" alt=""><div class="muted small centro">'+esc(fmtData(a.data))+'</div></div>'
        +'<div style="flex:1"><img data-path="'+esc(b.path)+'" style="width:100%;border-radius:8px" alt=""><div class="muted small centro">'+esc(fmtData(b.data))+'</div></div>'
        +'</div></section>';
    }
  }

  html+='<section class="card"><div class="linha"><h2>Linha do tempo <span class="muted small">'+fotos.length+'</span></h2>'
    +'<button class="btn mini '+(_fotoCompareModo?'':'sec-btn')+'" data-action="foto-comparar-modo">'+(_fotoCompareModo?'✓ escolhendo 2':'comparar')+'</button></div>';
  if(_fotoCompareModo) html+='<p class="muted small mt">Toque em duas fotos pra comparar.</p>';
  html+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:8px">';
  fotos.forEach(f=>{
    const sel=_fotoCompare.includes(f.id);
    html+='<div style="position:relative">'
      +'<img data-path="'+esc(f.path)+'" data-action="foto-toque" data-id="'+esc(f.id)+'" alt="'+esc(fmtData(f.data))+'" '
      +'style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;cursor:pointer;background:var(--surface-2)'+(sel?';outline:3px solid var(--brand);outline-offset:-3px':'')+'">'
      +'<span class="small" style="position:absolute;bottom:3px;left:3px;background:rgba(0,0,0,0.6);color:#fff;border-radius:4px;padding:0 4px">'+esc(fmtDataCurta(f.data))+'</span>'
      +'</div>';
  });
  html+='</div></section>';
  return html;
}

function viewProgressoTab(){
  let html=viewProgresso();
  if(typeof secaoConquistas==='function') html+=secaoConquistas();
  return html;
}

function abrirFoto(id){
  const f=(S.progresso||[]).find(x=>x.id===id);
  if(!f) return;
  abrirModal('<h3>'+esc(fmtData(f.data))+'</h3>'
    +'<img data-path="'+esc(f.path)+'" style="width:100%;border-radius:8px;background:var(--surface-2)" alt="">'
    +(f.nota?'<p class="sec small mt">'+esc(f.nota)+'</p>':'')
    +'<div class="acoes mt" style="display:flex;gap:0.5rem;flex-wrap:wrap"><button class="btn sec-btn" data-action="fechar-modal">fechar</button>'
    +'<button class="btn perigo" data-action="foto-del" data-id="'+esc(f.id)+'">apagar</button></div>');
  hidratarFotos();
}
