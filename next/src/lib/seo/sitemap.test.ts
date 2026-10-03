import { montarSitemap, paginaNoSitemap, type PaginaSitemap } from './sitemap';

const SITE = 'https://adai.com.br';
const pagina = (slug: string, extra: Partial<PaginaSitemap> = {}): PaginaSitemap => ({ slug, updatedAt: '2026-10-02T15:30:00.000Z', seo: null, ...extra });

describe('paginaNoSitemap', () => {
  it('página publicada comum entra', () => {
    expect(paginaNoSitemap(pagina('politica-de-privacidade'), SITE)).toBe(true);
  });

  it('"exemplos" (página de desenvolvimento) fica de fora', () => {
    expect(paginaNoSitemap(pagina('exemplos'), SITE)).toBe(false);
  });

  it('"Meta robots" com noindex no Strapi tira a página do sitemap', () => {
    expect(paginaNoSitemap(pagina('kids', { seo: { metaRobots: 'noindex, follow' } }), SITE)).toBe(false);
    expect(paginaNoSitemap(pagina('kids', { seo: { metaRobots: 'NOINDEX' } }), SITE)).toBe(false);
    expect(paginaNoSitemap(pagina('kids', { seo: { metaRobots: 'index, follow' } }), SITE)).toBe(true);
  });

  it('canonical apontando para outra URL tira a página; apontando para ela mesma, mantém', () => {
    expect(paginaNoSitemap(pagina('kids', { seo: { canonicalURL: 'https://adai.com.br/criancas' } }), SITE)).toBe(false);
    expect(paginaNoSitemap(pagina('kids', { seo: { canonicalURL: 'https://adai.com.br/kids/' } }), SITE)).toBe(true);
    expect(paginaNoSitemap(pagina('kids', { seo: { canonicalURL: '/kids' } }), SITE)).toBe(true);
  });

  it('slug fora do padrão de URL (vazio, maiúscula, barra) fica de fora', () => {
    for (const slug of ['', 'Kids', 'a/b', '../admin']) expect(paginaNoSitemap(pagina(slug), SITE)).toBe(false);
  });
});

describe('montarSitemap', () => {
  it('Home vira "/" com prioridade máxima; demais páginas em /<slug>; data da última atualização no Strapi', () => {
    expect(montarSitemap([pagina('politica-de-privacidade'), pagina('home', { updatedAt: '2026-10-01T10:00:00.000Z' })], SITE)).toEqual([
      { url: 'https://adai.com.br', lastModified: '2026-10-01', priority: 1 },
      { url: 'https://adai.com.br/politica-de-privacidade', lastModified: '2026-10-02', priority: 0.8 },
    ]);
  });

  it('data inválida ou ausente → sem lastModified (nunca "Invalid Date")', () => {
    const [semData, invalida] = montarSitemap([pagina('a', { updatedAt: null }), pagina('b', { updatedAt: 'ontem' })], SITE);
    expect(semData).not.toHaveProperty('lastModified');
    expect(invalida).not.toHaveProperty('lastModified');
  });

  it('remove as páginas fora do sitemap, não repete URL e ordena (Home primeiro)', () => {
    const urls = montarSitemap([pagina('kids'), pagina('exemplos'), pagina('agenda'), pagina('kids'), pagina('home')], SITE).map((e) => e.url);
    expect(urls).toEqual(['https://adai.com.br', 'https://adai.com.br/agenda', 'https://adai.com.br/kids']);
  });

  it('nenhuma página publicada → sitemap vazio', () => {
    expect(montarSitemap([], SITE)).toEqual([]);
  });
});
