/* ============================================================
   CONSTANTE — telas de conta (modo produto):
   entrar · criar conta · esqueci a senha · confirme o e-mail ·
   nova senha (link de recuperação)
   ============================================================ */
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
      +'<div class="campo"><label for="au-senha">Senha</label><input id="au-senha" type="password" autocomplete="current-password"></div>'
      +erro+ok
      +'<button class="btn bloco mt" data-action="auth-entrar">Entrar</button>'
      +'<div class="login-links mt">'
      +'<button data-action="auth-tela" data-t="criar">criar conta</button>'
      +'<button data-action="auth-tela" data-t="esqueci">esqueci a senha</button>'
      +'</div>';
  }
  else if(a.tela==='criar'){
    corpo='<div class="campo"><label for="au-email">E-mail</label><input id="au-email" type="email" autocomplete="email" value="'+esc(a.email||'')+'"></div>'
      +'<div class="campo"><label for="au-senha">Senha (mín. 6)</label><input id="au-senha" type="password" autocomplete="new-password"></div>'
      +'<div class="campo"><label for="au-senha2">Repete a senha</label><input id="au-senha2" type="password" autocomplete="new-password"></div>'
      +'<label class="login-consent"><input type="checkbox" id="au-consent">'
      +'<span>Li e aceito a <a href="privacidade.html" target="_blank" rel="noopener">Política de Privacidade</a> e consinto com o tratamento dos dados que eu registrar — inclusive os sensíveis de saúde e hábitos (LGPD).</span></label>'
      +erro+ok
      +'<button class="btn bloco mt" data-action="auth-cadastrar">Criar minha conta</button>'
      +'<div class="login-links mt"><button data-action="auth-tela" data-t="entrar">já tenho conta</button><span></span></div>';
  }
  else if(a.tela==='esqueci'){
    corpo='<p class="sec small">Te enviamos um link pra redefinir a senha.</p>'
      +'<div class="campo mt"><label for="au-email">E-mail da conta</label><input id="au-email" type="email" autocomplete="email" value="'+esc(a.email||'')+'"></div>'
      +erro+ok
      +'<button class="btn bloco mt" data-action="auth-esqueci-enviar">Enviar link</button>'
      +'<div class="login-links mt"><button data-action="auth-tela" data-t="entrar">← voltar</button><span></span></div>';
  }
  else if(a.tela==='confirmar'){
    corpo='<div class="ok-box">📬 Enviamos um link de confirmação pra <b>'+esc(a.email||'seu e-mail')+'</b>.<br>Abre lá (olha o spam também) e clica no link — aí é só entrar.</div>'
      +erro+ok
      +'<button class="btn sec-btn bloco mt" data-action="auth-reenviar">reenviar e-mail</button>'
      +'<div class="login-links mt"><button data-action="auth-tela" data-t="entrar">← já confirmei, entrar</button><span></span></div>';
  }
  else if(a.tela==='nova-senha'){
    corpo='<p class="sec small">Cria tua nova senha:</p>'
      +'<div class="campo mt"><label for="au-senha">Nova senha (mín. 6)</label><input id="au-senha" type="password" autocomplete="new-password"></div>'
      +'<div class="campo"><label for="au-senha2">Repete a nova senha</label><input id="au-senha2" type="password" autocomplete="new-password"></div>'
      +erro+ok
      +'<button class="btn bloco mt" data-action="auth-nova-senha-salvar">Salvar e entrar</button>';
  }

  document.getElementById('view').innerHTML=
    '<div class="login-wrap">'
    +'<div class="login-logo">c<em>o</em>nstante</div>'
    +'<p class="login-tag">sua vida no ritmo certo — sem picos, sempre constante 🟣</p>'
    +'<section class="card">'+corpo+'</section>'
    +'<p class="centro muted small">Seus dados são só seus: protegidos por conta, sem anúncio, sem venda de dados.<br><a href="privacidade.html" target="_blank" rel="noopener">Política de Privacidade</a></p>'
    +'</div>';
  document.getElementById('top-stats').innerHTML='';
}

function sairModoLogin(){
  document.body.classList.remove('modo-login');
  UI.auth=null;
}
