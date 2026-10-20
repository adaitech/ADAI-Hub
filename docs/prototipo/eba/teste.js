// Protótipo da entrega 2: troca o estado da tela do teste (no site, o estado vem do fluxo real).
(function () {
  var telas = document.querySelectorAll('[data-tela]');
  var abas = document.querySelectorAll('[data-estado]');
  var trocar = document.querySelector('[data-mostra-trocar]');
  var comSessao = ['pergunta', 'marcar', 'estilo', 'enviando', 'resultado', 'erro'];

  function mostrar(estado) {
    telas.forEach(function (tela) { tela.hidden = tela.getAttribute('data-tela') !== estado; });
    abas.forEach(function (aba) { aba.setAttribute('aria-pressed', String(aba.getAttribute('data-estado') === estado)); });
    if (trocar) trocar.hidden = comSessao.indexOf(estado) === -1;
    var foco = document.querySelector('[data-tela="' + estado + '"] h1, [data-tela="' + estado + '"] h2, [data-tela="' + estado + '"] legend');
    if (foco) { foco.setAttribute('tabindex', '-1'); foco.focus({ preventScroll: true }); }
  }

  abas.forEach(function (aba) { aba.addEventListener('click', function () { mostrar(aba.getAttribute('data-estado')); }); });
  document.addEventListener('click', function (e) {
    var alvo = e.target.closest('[data-ir]');
    if (alvo) mostrar(alvo.getAttribute('data-ir'));
  });
  // Escolher uma nota "avança": no protótipo, só mostra a marcação por um instante.
  document.querySelectorAll('.opcoes input').forEach(function (input) {
    input.addEventListener('change', function () { input.closest('.opcao').classList.add('opcao--escolhida'); });
  });
  function pelaUrl() {
    var estado = (location.hash || '').replace('#', '');
    mostrar(document.querySelector('[data-tela="' + estado + '"]') ? estado : 'abertura');
  }
  window.addEventListener('hashchange', pelaUrl);
  pelaUrl();
})();
