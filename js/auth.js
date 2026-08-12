'use strict';

let _sb=null;
let _sessao=null;

function modoProduto(){
  return typeof CONSTANTE_CONFIG!=='undefined'
    && !!(CONSTANTE_CONFIG.supabaseUrl && CONSTANTE_CONFIG.supabaseKey);
}
function clienteSB(){ return _sb; }
function sessaoAtual(){ return _sessao; }
function tokenAcesso(){ return _sessao ? _sessao.access_token : null; }
function usuarioAtual(){ return _sessao ? _sessao.user : null; }

const TURNSTILE_SITEKEY='0x4AAAAAAEOHD4v9PCdTaFVC';
let _captchaToken='';
let _captchaWidgetId=null;
function captchaToken(){ return _captchaToken; }
function renderCaptcha(){
  const box=document.getElementById('cf-turnstile');
  if(!box) return;
  if(typeof turnstile==='undefined'){ setTimeout(renderCaptcha,300); return; }
  _captchaToken='';
  try{ box.innerHTML=''; }catch(e){}
  try{
    _captchaWidgetId=turnstile.render(box,{
      sitekey:TURNSTILE_SITEKEY,
      callback:function(tk){ _captchaToken=tk; },
      'expired-callback':function(){ _captchaToken=''; },
      'error-callback':function(){ _captchaToken=''; }
    });
  }catch(e){}
}

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

async function authEntrar(email,senha,captcha){
  const {data,error}=await _sb.auth.signInWithPassword({email,password:senha,options:{captchaToken:captcha||''}});
  if(error) throw new Error(traduzErroAuth(error));
  return data;
}
async function authCadastrar(email,senha,captcha){
  const {data,error}=await _sb.auth.signUp({
    email, password:senha,
    options:{
      emailRedirectTo:urlDoApp(),
      captchaToken:captcha||'',
      data:{ consent_lgpd_at:new Date().toISOString() }
    }
  });
  if(error) throw new Error(traduzErroAuth(error));
  return data;
}
async function authReenviarConfirmacao(email,captcha){
  const {error}=await _sb.auth.resend({type:'signup',email,options:{emailRedirectTo:urlDoApp(),captchaToken:captcha||''}});
  if(error) throw new Error(traduzErroAuth(error));
}
async function authRecuperarSenha(email,captcha){
  const {error}=await _sb.auth.resetPasswordForEmail(email,{redirectTo:urlDoApp(),captchaToken:captcha||''});
  if(error) throw new Error(traduzErroAuth(error));
}
async function authTrocarSenha(nova){
  const {error}=await _sb.auth.updateUser({password:nova});
  if(error) throw new Error(traduzErroAuth(error));
}
async function authSair(){

  try{ await _sb.auth.signOut({scope:'local'}); }catch(e){}
}

async function authApagarConta(){
  const {error}=await _sb.rpc('delete_my_account');
  if(error) throw new Error('Não consegui apagar agora ('+(error.message||'erro')+'). Tenta de novo ou fala comigo pelo e-mail da política de privacidade.');
  await authSair();
}

function urlDoApp(){ return location.origin+location.pathname; }

function validarSenha(s){
  s=s||'';
  if(s.length<8) return 'A senha precisa ter pelo menos 8 caracteres.';
  if(!/[a-z]/.test(s)) return 'Inclui pelo menos uma letra minúscula.';
  if(!/[A-Z]/.test(s)) return 'Inclui pelo menos uma letra maiúscula.';
  if(!/[0-9]/.test(s)) return 'Inclui pelo menos um número.';
  if(!/[^a-zA-Z0-9]/.test(s)) return 'Inclui pelo menos um símbolo (ex.: !, @, #).';
  return '';
}

function traduzErroAuth(error){
  const m=(error&&error.message)||'';
  if(/Invalid login credentials/i.test(m)) return 'E-mail ou senha incorretos.';
  if(/Email not confirmed/i.test(m)) return 'Confirma teu e-mail primeiro — te enviamos um link. (Não chegou? Olha o spam ou reenvia abaixo.)';
  if(/already registered|already exists/i.test(m)) return 'Esse e-mail já tem conta — usa o "Entrar".';
  if(/should contain|one character of each|does not meet|weak.?password/i.test(m)) return 'A senha precisa ter no mínimo 8 caracteres, com letra maiúscula, minúscula, número e símbolo (ex.: !, @, #).';
  if(/at least \d+ characters|should be at least/i.test(m)) return 'A senha precisa ter pelo menos 8 caracteres.';
  if(/valid email/i.test(m)) return 'Esse e-mail não parece válido.';
  if(/rate limit|too many/i.test(m)) return 'Muitas tentativas em sequência — espera um minutinho e tenta de novo.';
  if(/captcha/i.test(m)) return 'A verificação de segurança não passou — espera ela carregar (uns segundos) e tenta de novo.';
  if(/Failed to fetch|NetworkError/i.test(m)) return 'Sem conexão com o servidor — confere tua internet.';
  return 'Algo deu errado: '+m;
}
