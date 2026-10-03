/**
 * Auditoria estrutural de acessibilidade/SEO num trecho de HTML (jsdom). Não substitui o axe no
 * navegador (contraste, foco visível, teclado real), mas pega no `yarn test` os erros que mais
 * escapam em componente vindo do CMS: imagem sem alt, link sem nome, id repetido, referência
 * ARIA quebrada, "undefined" na tela, nova aba sem aviso…
 *
 * Devolve a lista de problemas (vazia = ok), para a falha do teste dizer exatamente o que corrigir.
 */
export function auditarAcessibilidade(raiz: ParentNode): string[] {
  const problemas: string[] = [];
  const descrever = (el: Element) => el.outerHTML.slice(0, 120);
  const nomeAcessivel = (el: Element) =>
    Boolean(
      el.textContent?.trim() ||
        el.getAttribute('aria-label')?.trim() ||
        el.getAttribute('aria-labelledby') ||
        el.querySelector('img[alt]:not([alt=""])'),
    );

  for (const img of raiz.querySelectorAll('img')) {
    if (!img.hasAttribute('alt')) problemas.push(`imagem sem alt (use alt="" se for decorativa): ${descrever(img)}`);
  }

  for (const link of raiz.querySelectorAll('a')) {
    const href = link.getAttribute('href');
    if (!href) problemas.push(`link sem href: ${descrever(link)}`);
    if (href && /^\s*javascript:/i.test(href)) problemas.push(`link com javascript: ${descrever(link)}`);
    if (!nomeAcessivel(link)) problemas.push(`link sem nome acessível: ${descrever(link)}`);
    if (link.getAttribute('target') === '_blank') {
      if (!/noopener/.test(link.getAttribute('rel') ?? '')) problemas.push(`nova aba sem rel="noopener": ${descrever(link)}`);
      if (!/abre em nova aba/i.test(link.textContent ?? '') && !/nova aba/i.test(link.getAttribute('aria-label') ?? '')) {
        problemas.push(`nova aba sem aviso para leitor de tela: ${descrever(link)}`);
      }
    }
    if (link.querySelector('a, button')) problemas.push(`elemento interativo dentro de link: ${descrever(link)}`);
  }

  for (const botao of raiz.querySelectorAll('button')) {
    if (!nomeAcessivel(botao)) problemas.push(`botão sem nome acessível: ${descrever(botao)}`);
    if (botao.querySelector('a, button')) problemas.push(`elemento interativo dentro de botão: ${descrever(botao)}`);
  }

  const ids = [...raiz.querySelectorAll('[id]')].map((el) => el.id);
  for (const id of new Set(ids.filter((id, i) => ids.indexOf(id) !== i))) problemas.push(`id repetido: "${id}"`);

  const documentoRaiz = (raiz as Node).ownerDocument ?? (raiz as Document);
  const existe = (id: string) => ids.includes(id) || Boolean(documentoRaiz.getElementById(id));
  for (const atributo of ['aria-labelledby', 'aria-describedby', 'aria-controls']) {
    for (const el of raiz.querySelectorAll(`[${atributo}]`)) {
      for (const id of (el.getAttribute(atributo) ?? '').split(/\s+/).filter(Boolean)) {
        if (!existe(id)) problemas.push(`${atributo} aponta para id inexistente "${id}": ${descrever(el)}`);
      }
    }
  }

  for (const secao of raiz.querySelectorAll('section[data-section]')) {
    if (!secao.hasAttribute('aria-labelledby') && !secao.hasAttribute('aria-label')) {
      problemas.push(`<section> sem nome (aria-labelledby/aria-label): ${descrever(secao)}`);
    }
  }

  // Nó a nó: o textContent junta elementos vizinhos sem espaço ("X" + "undefined" = "Xundefined").
  const textos = documentoRaiz.createTreeWalker(raiz as Node, 4 /* NodeFilter.SHOW_TEXT */);
  for (let no = textos.nextNode(); no; no = textos.nextNode()) {
    const lixo = /\bundefined\b|\[object Object\]|\bNaN\b/.exec(no.textContent ?? '');
    if (lixo) problemas.push(`texto quebrado na tela: "${lixo[0]}" (campo do CMS sem tratamento no normalize)`);
  }

  return problemas;
}

/** Títulos da página: exatamente um h1 e nenhum salto (h2 → h4). */
export function auditarTitulos(raiz: ParentNode): string[] {
  const niveis = [...raiz.querySelectorAll('h1, h2, h3, h4, h5, h6')].map((h) => ({ nivel: Number(h.tagName[1]), texto: h.textContent?.trim() }));
  const problemas: string[] = [];
  const h1 = niveis.filter((h) => h.nivel === 1).length;
  if (h1 !== 1) problemas.push(`a página deve ter exatamente 1 h1 (tem ${h1})`);
  niveis.forEach((h, i) => {
    if (i > 0 && h.nivel > niveis[i - 1].nivel + 1) problemas.push(`salto de título: h${niveis[i - 1].nivel} → h${h.nivel} ("${h.texto}")`);
  });
  return problemas;
}
