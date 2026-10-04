/**
 * Integração das rotas de SEO do Next com o Strapi (simulado com o JSON real):
 * `app/sitemap.ts` → `listarPaginasPublicadas` → regras de `lib/seo` → lista de URLs;
 * `app/robots.ts` → configuração do ambiente → regras do robots.txt.
 */
import robots from '@/app/robots';
import sitemap from '@/app/sitemap';
import { criarStrapiFake } from '@/test-utils/strapi-fake';

const ambiente = process.env as Record<string, string | undefined>;
const original = { SITE_INDEXAVEL: ambiente.SITE_INDEXAVEL, NEXT_PUBLIC_SITE_URL: ambiente.NEXT_PUBLIC_SITE_URL };
let strapi: ReturnType<typeof criarStrapiFake>;

function producao() {
  ambiente.SITE_INDEXAVEL = 'true';
  ambiente.NEXT_PUBLIC_SITE_URL = 'https://adai.com.br';
}

beforeEach(() => {
  delete ambiente.SITE_INDEXAVEL;
  ambiente.NEXT_PUBLIC_SITE_URL = 'https://homologacao.adai.com.br';
  strapi = criarStrapiFake();
  globalThis.fetch = strapi.fetch;
});

afterAll(() => Object.assign(ambiente, original));

describe('/sitemap.xml', () => {
  it('produção: Home e páginas publicadas no Strapi, com URL absoluta do site', async () => {
    producao();
    expect(await sitemap()).toEqual([
      { url: 'https://adai.com.br', lastModified: '2026-10-02', priority: 1 },
      { url: 'https://adai.com.br/campestre', lastModified: '2026-10-02', priority: 0.8 },
      { url: 'https://adai.com.br/politica-de-privacidade', lastModified: '2026-10-02', priority: 0.8 },
      { url: 'https://adai.com.br/sobre-nos/nossa-historia', lastModified: '2026-10-02', priority: 0.8 },
    ]);
  });

  it('página nova publicada no Strapi entra sozinha; "exemplos" e noindex ficam de fora', async () => {
    producao();
    const base = strapi.paginas.home;
    strapi.paginas.kids = { ...base, id: 3, slug: 'kids' };
    strapi.paginas.exemplos = { ...base, id: 4, slug: 'exemplos' };
    strapi.paginas.rascunho = { ...base, id: 5, slug: 'teste-interno', seo: { ...base.seo!, metaRobots: 'noindex' } as never };
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls).toEqual(['https://adai.com.br', 'https://adai.com.br/campestre', 'https://adai.com.br/kids', 'https://adai.com.br/politica-de-privacidade', 'https://adai.com.br/sobre-nos/nossa-historia']);
  });

  it('fora de produção: sitemap vazio e nenhuma consulta ao Strapi', async () => {
    expect(await sitemap()).toEqual([]);
    expect(strapi.fetch).not.toHaveBeenCalled();
  });

  it('Strapi fora do ar → erro (o Next continua servindo o último sitemap gerado)', async () => {
    producao();
    strapi.foraDoAr();
    await expect(sitemap()).rejects.toThrow('Strapi respondeu 503');
  });
});

describe('/robots.txt', () => {
  it('produção: libera o site, bloqueia áreas internas e aponta o sitemap', () => {
    producao();
    expect(robots()).toEqual({
      rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/componentes', '/exemplos'] },
      sitemap: 'https://adai.com.br/sitemap.xml',
    });
  });

  it('homologação/dev (sem SITE_INDEXAVEL): bloqueia tudo', () => {
    expect(robots()).toEqual({ rules: { userAgent: '*', disallow: '/' } });
  });
});
