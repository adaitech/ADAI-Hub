(function () {
  'use strict';
  document.documentElement.classList.add('js');

  // Toast: rotas do Hub ainda não prototipadas e links externos não saem do protótipo.
  var toast = document.getElementById('toast');
  var tempo;
  function avisar(texto) {
    toast.textContent = texto;
    toast.hidden = false;
    clearTimeout(tempo);
    tempo = setTimeout(function () { toast.hidden = true; }, 2800);
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (a.hasAttribute('data-externo')) {
      e.preventDefault();
      avisar('Protótipo: este link leva a ' + href.replace(/^https?:\/\//, '').slice(0, 70));
    } else if (href.charAt(0) === '/' || href.indexOf('mailto:') === 0) {
      e.preventDefault();
      avisar('Protótipo: este link leva a ' + href);
    }
  });

  // Preferências do protótipo (podem não existir em janela privada)
  function ler(chave) { try { return window.localStorage.getItem(chave); } catch (err) { return null; } }
  function gravar(chave, valor) { try { window.localStorage.setItem(chave, valor); } catch (err) { /* sem armazenamento */ } }

  // Navegação interna A/B (decisão do protótipo). ?nav=b também funciona.
  var grupo = document.querySelector('.grupo-nav');
  var botoesNav = document.querySelectorAll('[data-nav]');
  function aplicarNav(valor) {
    document.body.classList.toggle('nav-b', valor === 'b');
    botoesNav.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.nav === valor)); });
  }
  var pedido = new URLSearchParams(window.location.search).get('nav');
  var inicial = pedido === 'a' || pedido === 'b' ? pedido : (ler('eba-nav') || 'a');
  aplicarNav(inicial);
  grupo.hidden = false;
  botoesNav.forEach(function (b) {
    b.addEventListener('click', function () { aplicarNav(b.dataset.nav); gravar('eba-nav', b.dataset.nav); });
  });

  // Marcações Observado / Derivado / Proposto
  var alternar = document.getElementById('alternar-anotacoes');
  function aplicarAnotacoes(ligado) {
    alternar.setAttribute('aria-pressed', String(ligado));
    alternar.textContent = ligado ? 'Ocultar marcações O/D/P' : 'Mostrar marcações O/D/P';
    document.body.classList.toggle('mostrar-anotacoes', ligado);
  }
  aplicarAnotacoes(ler('eba-anotacoes') === '1');
  alternar.hidden = false;
  alternar.addEventListener('click', function () {
    var ligado = alternar.getAttribute('aria-pressed') !== 'true';
    aplicarAnotacoes(ligado);
    gravar('eba-anotacoes', ligado ? '1' : '0');
  });

  // Menu compacto (< 1024px) — mesmo comportamento do protótipo do design system
  var botaoMenu = document.querySelector('.menu-botao');
  var painel = document.getElementById('menu-principal');
  var desktop = window.matchMedia('(min-width: 1024px)');
  function sincronizarMenu() {
    if (desktop.matches) { painel.hidden = false; botaoMenu.setAttribute('aria-expanded', 'false'); }
    else if (botaoMenu.getAttribute('aria-expanded') !== 'true') { painel.hidden = true; }
  }
  botaoMenu.hidden = false;
  botaoMenu.addEventListener('click', function () {
    var aberto = botaoMenu.getAttribute('aria-expanded') === 'true';
    botaoMenu.setAttribute('aria-expanded', String(!aberto));
    painel.hidden = aberto;
    if (!aberto) { var primeiro = painel.querySelector('a'); if (primeiro) primeiro.focus(); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && botaoMenu.getAttribute('aria-expanded') === 'true' && !desktop.matches) {
      botaoMenu.setAttribute('aria-expanded', 'false');
      painel.hidden = true;
      botaoMenu.focus();
    }
  });
  desktop.addEventListener('change', sincronizarMenu);
  sincronizarMenu();

  // Vídeo de apresentação: <dialog> nativo; o foco volta ao botão ao fechar
  var dialogo = document.getElementById('dialogo-video');
  var abre = document.querySelector('[data-abre-video]');
  if (dialogo && abre && typeof dialogo.showModal === 'function') {
    abre.addEventListener('click', function () { dialogo.showModal(); });
    dialogo.querySelector('[data-fecha-video]').addEventListener('click', function () { dialogo.close(); });
    dialogo.addEventListener('close', function () { abre.focus(); });
  }
})();
