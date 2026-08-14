'use strict';

function renderLogin(){
  document.body.classList.add('modo-login');
  if(!UI.auth) UI.auth={tela:'entrar',email:''};
  const a=UI.auth;
  const erro=a.erro?'<div class="aviso mt" role="alert">'+esc(a.erro)+'</div>':'';
  const ok=a.msg?'<div class="ok-box mt" role="status">'+esc(a.msg)+'</div>':'';
  let corpo='';

  if(a.tela==='entrar'){
    corpo='<div class="campo"><label for="au-email">E-mail</label><input id="au-email" type="email" autocomplete="email" value="'+esc(a.email||'')+'"></div>'
      +'<div class="campo"><label for="au-senha">Senha</label>'+senhaInput('au-senha','current-password')+'</div>'
      +erro+ok
      +'<div id="cf-turnstile" class="mt"></div>'
      +'<button class="btn bloco mt" data-action="auth-entrar">Entrar</button>'
      +'<div class="login-links mt">'
      +'<button data-action="auth-tela" data-t="criar">Criar conta</button>'
      +'<button data-action="auth-tela" data-t="esqueci">Esqueci a senha</button>'
      +'</div>';
  }
  else if(a.tela==='criar'){
    corpo='<div class="campo"><label for="au-email">E-mail</label><input id="au-email" type="email" autocomplete="email" value="'+esc(a.email||'')+'"></div>'
      +'<div class="campo"><label for="au-senha">Senha</label>'+senhaInput('au-senha','new-password')+'<span class="muted small">Mín. 8 caracteres, com maiúscula, minúscula e número.</span></div>'
      +'<div class="campo"><label for="au-senha2">Repete a senha</label>'+senhaInput('au-senha2','new-password')+'</div>'
      +'<label class="login-consent"><input type="checkbox" id="au-consent">'
      +'<span>Li e aceito a <a href="privacidade.html" target="_blank" rel="noopener">Política de Privacidade</a> e consinto com o tratamento dos dados que eu registrar — inclusive os sensíveis de saúde e hábitos (LGPD).</span></label>'
      +erro+ok
      +'<div id="cf-turnstile" class="mt"></div>'
      +'<button class="btn bloco mt" data-action="auth-cadastrar">Criar minha conta</button>'
      +'<div class="login-links mt"><button data-action="auth-tela" data-t="entrar">Já tenho conta</button><span></span></div>';
  }
  else if(a.tela==='esqueci'){
    corpo='<p class="sec small">Digita o e-mail da tua conta que a gente te envia um link pra criar uma senha nova.</p>'
      +'<div class="campo mt"><label for="au-email">E-mail da conta</label><input id="au-email" type="email" autocomplete="email" value="'+esc(a.email||'')+'"></div>'
      +erro+ok
      +'<div id="cf-turnstile" class="mt"></div>'
      +'<button class="btn bloco mt" data-action="auth-esqueci-enviar">Enviar link</button>'
      +'<div class="login-links mt"><button data-action="auth-tela" data-t="entrar">← Voltar</button><span></span></div>';
  }
  else if(a.tela==='confirmar'){
    corpo='<div class="ok-box">📬 Enviamos um link de confirmação pra <b>'+esc(a.email||'seu e-mail')+'</b>.<br>Abre lá (olha o spam também) e clica no link — aí é só entrar.</div>'
      +erro+ok
      +'<div id="cf-turnstile" class="mt"></div>'
      +'<button class="btn sec-btn bloco mt" data-action="auth-reenviar">Reenviar e-mail</button>'
      +'<div class="login-links mt"><button data-action="auth-tela" data-t="entrar">← Já confirmei, entrar</button><span></span></div>';
  }
  else if(a.tela==='nova-senha'){
    corpo='<p class="sec small">Cria tua nova senha:</p>'
      +'<div class="campo mt"><label for="au-senha">Nova senha</label>'+senhaInput('au-senha','new-password')+'<span class="muted small">Mín. 8 caracteres, com maiúscula, minúscula e número.</span></div>'
      +'<div class="campo"><label for="au-senha2">Repete a nova senha</label>'+senhaInput('au-senha2','new-password')+'</div>'
      +erro+ok
      +'<button class="btn bloco mt" data-action="auth-nova-senha-salvar">Salvar e entrar</button>';
  }

  const semConta=(a.tela==='entrar'||a.tela==='criar')
    ? '<button class="btn sec-btn bloco mt" data-action="visitante-entrar">Ver o app sem criar conta</button>'
      +'<p class="muted small centro mt">Dá pra experimentar tudo antes. Se você criar conta depois, o que anotou vai junto.</p>'
    : '';
  document.getElementById('view').innerHTML=
    '<div class="login-wrap">'
    +'<div class="login-logo">c<em>o</em>nstante</div>'
    +'<p class="login-tag">sua vida no ritmo certo — sem picos, sempre constante 🟣</p>'
    +'<section class="card">'+corpo+semConta+'</section>'
    +'<p class="centro muted small">Seus dados são só seus: protegidos por conta, sem anúncio, sem venda de dados.<br><a href="privacidade.html" target="_blank" rel="noopener">Política de Privacidade</a></p>'
    +'</div>';
  document.getElementById('top-stats').innerHTML='';
  if(typeof renderCaptcha==='function') renderCaptcha();
}

function sairModoLogin(){
  document.body.classList.remove('modo-login');
  UI.auth=null;
}
