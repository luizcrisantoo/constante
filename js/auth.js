/* ============================================================
   CONSTANTE — autenticação (modo produto)
   Wrapper fino sobre o supabase-js vendorizado (js/vendor-supabase.js).
   Sessão persistida e renovada automaticamente pela lib.
   ============================================================ */
'use strict';

let _sb=null;      // cliente supabase
let _sessao=null;  // sessão atual (ou null)

function modoProduto(){
  return typeof CONSTANTE_CONFIG!=='undefined'
    && !!(CONSTANTE_CONFIG.supabaseUrl && CONSTANTE_CONFIG.supabaseKey);
}
function clienteSB(){ return _sb; }
function sessaoAtual(){ return _sessao; }
function tokenAcesso(){ return _sessao ? _sessao.access_token : null; }
function usuarioAtual(){ return _sessao ? _sessao.user : null; }

/* inicia o cliente e devolve a sessão persistida (se houver).
   aoMudar(evento, sessao) é chamado em SIGNED_IN / SIGNED_OUT /
   PASSWORD_RECOVERY / TOKEN_REFRESHED. */
function initAuth(aoMudar){
  if(!modoProduto() || typeof supabase==='undefined') return Promise.resolve(null);
  try{
    _sb=supabase.createClient(CONSTANTE_CONFIG.supabaseUrl, CONSTANTE_CONFIG.supabaseKey, {
      auth:{ persistSession:true, autoRefreshToken:true, detectSessionInUrl:true }
    });
  }catch(e){ return Promise.resolve(null); }
  _sb.auth.onAuthStateChange((evento,sessao)=>{
    const antes=_sessao; _sessao=sessao;
    if(aoMudar) aoMudar(evento,sessao,antes);
  });
  return _sb.auth.getSession().then(({data})=>{ _sessao=data.session||null; return _sessao; }).catch(()=>null);
}

async function authEntrar(email,senha){
  const {data,error}=await _sb.auth.signInWithPassword({email,password:senha});
  if(error) throw new Error(traduzErroAuth(error));
  return data;
}
async function authCadastrar(email,senha){
  const {data,error}=await _sb.auth.signUp({
    email, password:senha,
    options:{
      emailRedirectTo:urlDoApp(),
      data:{ consent_lgpd_at:new Date().toISOString() } // consentimento registrado no cadastro
    }
  });
  if(error) throw new Error(traduzErroAuth(error));
  return data; // com confirmação ligada, data.session vem null até confirmar o e-mail
}
async function authReenviarConfirmacao(email){
  const {error}=await _sb.auth.resend({type:'signup',email,options:{emailRedirectTo:urlDoApp()}});
  if(error) throw new Error(traduzErroAuth(error));
}
async function authRecuperarSenha(email){
  const {error}=await _sb.auth.resetPasswordForEmail(email,{redirectTo:urlDoApp()});
  if(error) throw new Error(traduzErroAuth(error));
}
async function authTrocarSenha(nova){
  const {error}=await _sb.auth.updateUser({password:nova});
  if(error) throw new Error(traduzErroAuth(error));
}
async function authSair(){
  // scope:'local' — desloga SÓ este aparelho (não derruba o outro do Luiz)
  try{ await _sb.auth.signOut({scope:'local'}); }catch(e){}
}
/* LGPD: apaga o usuário no auth (cascade remove a linha de dados) e limpa o aparelho */
async function authApagarConta(){
  const {error}=await _sb.rpc('delete_my_account');
  if(error) throw new Error('Não consegui apagar agora ('+(error.message||'erro')+'). Tenta de novo ou fala comigo pelo e-mail da política de privacidade.');
  await authSair();
}

function urlDoApp(){ return location.origin+location.pathname; }

function traduzErroAuth(error){
  const m=(error&&error.message)||'';
  if(/Invalid login credentials/i.test(m)) return 'E-mail ou senha incorretos.';
  if(/Email not confirmed/i.test(m)) return 'Confirma teu e-mail primeiro — te enviamos um link. (Não chegou? Olha o spam ou reenvia abaixo.)';
  if(/already registered|already exists/i.test(m)) return 'Esse e-mail já tem conta — usa o "Entrar".';
  if(/at least 6 characters/i.test(m)) return 'A senha precisa ter pelo menos 6 caracteres.';
  if(/valid email/i.test(m)) return 'Esse e-mail não parece válido.';
  if(/rate limit|too many/i.test(m)) return 'Muitas tentativas em sequência — espera um minutinho e tenta de novo.';
  if(/Failed to fetch|NetworkError/i.test(m)) return 'Sem conexão com o servidor — confere tua internet.';
  return 'Algo deu errado: '+m;
}
