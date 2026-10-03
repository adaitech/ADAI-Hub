#!/usr/bin/env node
/**
 * Smoke test do site NO AR: confere, contra um servidor rodando (Next + Strapi), o que os testes
 * do Jest não alcançam — o Strapi real respondendo, as páginas publicadas, imagens carregando e
 * as APIs protegidas.
 *
 *   yarn smoke                                   # http://localhost:3000 (yarn dev ou yarn start)
 *   yarn smoke https://homologacao.adai.com.br   # ou SMOKE_URL=...
 *
 * Sai com código 1 se algo falhar (serve para CI e para o checklist de Pull Request).
 * Não usa segredos: só testa que as APIs protegidas recusam quem não tem o segredo.
 */

const BASE = (process.argv[2] ?? process.env.SMOKE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const PAGINAS_DO_SITE = ['/', '/politica-de-privacidade'];
/** Páginas internas: precisam de noindex (a /exemplos tem "Meta robots" noindex no Strapi). */
const PAGINAS_INTERNAS = ['/exemplos'];
const MAX_IMAGENS = 6;

const resultados = [];
const registrar = (ok, nome, detalhe = '') => resultados.push({ ok, nome, detalhe });

async function pedir(caminho, opcoes = {}) {
  const inicio = Date.now();
  const resposta = await fetch(`${BASE}${caminho}`, { redirect: 'manual', ...opcoes });
  const corpo = opcoes.method === 'HEAD' ? '' : await resposta.text();
  return { status: resposta.status, corpo, local: resposta.headers.get('location'), ms: Date.now() - inicio };
}

/** HTML sem <script>/<style>: o que vira texto e marcação de verdade. */
const semScripts = (html) => html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
const contar = (html, regex) => (html.match(regex) ?? []).length;
const atributo = (html, regex) => regex.exec(html)?.[1]?.trim() ?? '';

async function conferirPagina(caminho, { interna = false } = {}) {
  try {
    const { status, corpo, ms } = await pedir(caminho);
    if (status !== 200) return registrar(false, `GET ${caminho}`, `status ${status}`);
    const html = semScripts(corpo);
    const problemas = [];
    const h1 = contar(html, /<h1[\s>]/gi);
    if (h1 !== 1) problemas.push(`${h1} h1`);
    if (!/<html[^>]*lang="pt-BR"/i.test(corpo)) problemas.push('sem lang="pt-BR"');
    if (!atributo(corpo, /<title>([^<]*)<\/title>/i)) problemas.push('sem <title>');
    if (!interna) {
      if (atributo(corpo, /<meta name="description" content="([^"]*)"/i).length < 50) problemas.push('meta description ausente ou curta');
      if (!atributo(corpo, /<link rel="canonical" href="([^"]*)"/i)) problemas.push('sem canonical');
      if (/<meta name="robots" content="[^"]*noindex/i.test(corpo)) problemas.push('página do site com noindex');
    } else if (!/<meta name="robots" content="[^"]*noindex/i.test(corpo)) {
      problemas.push('página interna sem noindex');
    }
    const lixo = />[^<]*\b(undefined|NaN)\b[^<]*</.exec(html) ?? /\[object Object\]/.exec(html);
    if (lixo) problemas.push(`texto quebrado: "${lixo[0].slice(0, 40)}"`);
    registrar(problemas.length === 0, `GET ${caminho}`, problemas.join('; ') || `200 em ${ms} ms`);
    return corpo;
  } catch (erro) {
    registrar(false, `GET ${caminho}`, erro.message);
  }
}

async function conferirImagens(html, origem) {
  const fontes = [...new Set([...html.matchAll(/<img[^>]+src="([^"]+)"/gi)].map((m) => m[1].replace(/&amp;/g, '&')))].slice(0, MAX_IMAGENS);
  for (const src of fontes) {
    const url = src.startsWith('http') ? src : `${BASE}${src}`;
    try {
      const resposta = await fetch(url);
      const tipo = resposta.headers.get('content-type') ?? '';
      registrar(resposta.ok && tipo.startsWith('image/'), `imagem de ${origem}`, `${resposta.status} ${tipo} ${src.slice(0, 70)}`);
    } catch (erro) {
      registrar(false, `imagem de ${origem}`, `${erro.message} ${src.slice(0, 70)}`);
    }
  }
}

async function esperarStatus(nome, caminho, esperado, opcoes) {
  try {
    const { status, local } = await pedir(caminho, opcoes);
    const ok = Array.isArray(esperado) ? esperado.includes(status) : status === esperado;
    registrar(ok, nome, `status ${status}${local ? ` → ${local}` : ''}`);
    return { status, local };
  } catch (erro) {
    registrar(false, nome, erro.message);
    return {};
  }
}

/** robots.txt coerente com o ambiente; sitemap válido e, em produção, só com URLs que respondem 200. */
async function conferirSeo() {
  let robots = '';
  try {
    const { status, corpo } = await pedir('/robots.txt');
    robots = corpo;
    registrar(status === 200 && /User-Agent: \*/i.test(corpo), 'GET /robots.txt', `status ${status}`);
  } catch (erro) {
    return registrar(false, 'GET /robots.txt', erro.message);
  }

  const bloqueado = /^Disallow: \/\s*$/im.test(robots);
  const linhaSitemap = /^Sitemap: (\S+)/im.exec(robots)?.[1];
  if (bloqueado) {
    registrar(!linhaSitemap, 'robots.txt fora de produção', linhaSitemap ? 'bloqueia tudo mas divulga sitemap' : 'bloqueia tudo (SITE_INDEXAVEL desligado)');
  } else {
    const problemas = [];
    if (!linhaSitemap?.endsWith('/sitemap.xml')) problemas.push('sem linha Sitemap');
    for (const area of ['/api/', '/componentes', '/exemplos']) if (!robots.includes(`Disallow: ${area}`)) problemas.push(`não bloqueia ${area}`);
    registrar(problemas.length === 0, 'robots.txt de produção', problemas.join('; ') || `sitemap: ${linhaSitemap}`);
  }

  try {
    const { status, corpo } = await pedir('/sitemap.xml');
    const urls = [...corpo.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    const ok = status === 200 && /<urlset/.test(corpo) && (bloqueado ? urls.length === 0 : urls.length > 0);
    registrar(ok, 'GET /sitemap.xml', `status ${status}, ${urls.length} URL(s)${bloqueado ? ' (vazio fora de produção)' : ''}`);
    if (urls.some((u) => /\/(exemplos|componentes|api)(\/|$)/.test(u))) registrar(false, 'sitemap sem áreas internas', urls.join(' '));
    for (const url of urls.slice(0, 20)) {
      // Confere no servidor testado (o domínio do sitemap pode ainda não apontar para ele).
      const caminho = new URL(url).pathname;
      const resposta = await pedir(caminho);
      registrar(resposta.status === 200, 'URL do sitemap responde 200', `${resposta.status} ${caminho}`);
    }
  } catch (erro) {
    registrar(false, 'GET /sitemap.xml', erro.message);
  }
}

async function principal() {
  console.log(`\nSmoke test — ${BASE}\n`);

  try {
    await fetch(BASE, { redirect: 'manual' });
  } catch {
    console.error(`❌ ${BASE} não respondeu. Suba o site (yarn dev ou yarn build && yarn start) e o Strapi antes.`);
    process.exit(1);
  }

  for (const caminho of PAGINAS_DO_SITE) {
    const html = await conferirPagina(caminho);
    if (html && caminho === '/') await conferirImagens(html, caminho);
  }

  for (const caminho of PAGINAS_INTERNAS) await conferirPagina(caminho, { interna: true });
  await conferirSeo();
  await esperarStatus('rota inexistente → 404', '/rota-que-nao-existe-smoke', 404);
  const { local } = await esperarStatus('/home → redireciona para /', '/home', [307, 308]);
  if (local && new URL(local, BASE).pathname !== '/') registrar(false, '/home → redireciona para /', `foi para ${local}`);

  await esperarStatus('webhook de revalidação sem segredo → 401', '/api/revalidate', 401, { method: 'POST' });
  await esperarStatus('preview sem segredo → 401', '/api/preview?secret=smoke&slug=home', 401);

  const vitrine = await pedir('/componentes').catch(() => ({ status: 0 }));
  if (vitrine.status === 404) {
    registrar(true, 'vitrine /componentes', 'desligada neste ambiente (404) — correto em produção');
  } else {
    await conferirPagina('/componentes', { interna: true });
    const slugs = [...new Set([...(vitrine.corpo ?? '').matchAll(/href="\/componentes\/([a-z0-9-]+)"/g)].map((m) => m[1]))];
    for (const slug of slugs) await conferirPagina(`/componentes/${slug}`, { interna: true });
  }

  const falhas = resultados.filter((r) => !r.ok);
  for (const r of resultados) console.log(`${r.ok ? '✅' : '❌'} ${r.nome.padEnd(46)} ${r.detalhe}`);
  console.log(`\n${resultados.length - falhas.length}/${resultados.length} ok${falhas.length ? ` — ${falhas.length} falha(s)` : ''}\n`);
  process.exit(falhas.length ? 1 : 0);
}

principal();
