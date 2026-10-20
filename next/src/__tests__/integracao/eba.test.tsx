/**
 * Rotas da EBA ponta a ponta no servidor, sem rede: page.tsx → queries (pages e cursos) →
 * Strapi simulado com o JSON real → seções → HTML.
 */
import { screen, within } from '@testing-library/react';
import { draftMode } from 'next/headers';
import EbaPage, { generateMetadata as metadataEba } from '@/app/(site)/eba/page';
import CursosPage, { generateMetadata as metadataCursos } from '@/app/(site)/eba/cursos/page';
import CursoPage, { generateMetadata as metadataCurso } from '@/app/(site)/eba/cursos/[slug]/page';
import EbaSubPage, { generateMetadata as metadataEbaSub } from '@/app/(site)/eba/[slug]/page';
import { renderizarServidor } from '@/test-utils/servidor';
import { criarStrapiFake } from '@/test-utils/strapi-fake';

jest.mock('next/headers', () => ({ draftMode: jest.fn(), headers: jest.fn(async () => new Headers({ 'x-nonce': 'nonce-de-teste' })) }));

let strapi: ReturnType<typeof criarStrapiFake>;
const ORIGINAL = { ...process.env };

beforeEach(() => {
  jest.clearAllMocks();
  (draftMode as jest.Mock).mockResolvedValue({ isEnabled: false });
  process.env.NEXT_PUBLIC_SITE_URL = 'https://adai.com.br';
  strapi = criarStrapiFake();
  globalThis.fetch = strapi.fetch;
});

afterAll(() => {
  process.env = ORIGINAL;
});

async function erroDe(chamada: Promise<unknown>) {
  return (await chamada.catch((e: unknown) => e)) as { digest?: string; message?: string };
}
const params = (slug: string) => ({ params: Promise.resolve({ slug }) });
const jsonLd = (container: HTMLElement) =>
  [...container.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent ?? '{}') as { '@type': string });

describe('/eba — home da EBA', () => {
  it('monta a página "eba" do Strapi com um h1 e o catálogo de cursos', async () => {
    const { container } = await renderizarServidor(await EbaPage());
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(container.querySelector('[data-section="catalogo-cursos"]')).not.toBeNull();
    expect((await metadataEba()).alternates?.canonical).toMatch(/\/eba$/);
  });

  it('sem a página no Strapi → 404', async () => {
    delete strapi.paginas.eba;
    expect((await erroDe(EbaPage())).digest).toBe('NEXT_HTTP_ERROR_FALLBACK;404');
  });
});

describe('/eba/<slug> — outras páginas da EBA no Strapi ("eba-<slug>")', () => {
  it('página "eba-sobre" do Strapi abre em /eba/sobre, com canonical aninhado', async () => {
    strapi.paginas['eba-sobre'] = { ...strapi.paginas.eba, id: 8, documentId: 'eba-sobre', slug: 'eba-sobre' };
    await renderizarServidor(await EbaSubPage(params('sobre')));
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect((await metadataEbaSub(params('sobre'))).alternates?.canonical).toMatch(/\/eba\/sobre$/);
  });

  it('inexistente ou fora do padrão → 404', async () => {
    expect((await erroDe(EbaSubPage(params('nao-existe')))).digest).toBe('NEXT_HTTP_ERROR_FALLBACK;404');
    expect((await erroDe(EbaSubPage(params('Sobre')))).digest).toBe('NEXT_HTTP_ERROR_FALLBACK;404');
  });
});

describe('/eba/cursos — catálogo', () => {
  it('trilha ADAI › EBA › Cursos, catálogo abrindo a página (h1) e ItemList', async () => {
    const { container } = await renderizarServidor(await CursosPage());
    const trilha = screen.getByRole('navigation', { name: 'Trilha' });
    expect(within(trilha).getByText('Cursos')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['Reset', 'Start', 'Talmidim']);
    expect(jsonLd(container).map((d) => d['@type'])).toEqual(expect.arrayContaining(['ItemList', 'BreadcrumbList']));
    expect((await metadataCursos()).alternates?.canonical).toMatch(/\/eba\/cursos$/);
  });
});

describe('/eba/cursos/[slug] — página do curso', () => {
  it('trilha, topo do curso, corpo do Strapi, âncora das perguntas, inscrição final e outros cursos', async () => {
    const { container } = await renderizarServidor(await CursoPage(params('talmidim')));
    expect(screen.getByRole('heading', { level: 1, name: 'Talmidim' })).toBeInTheDocument();
    expect(container.querySelector('[data-section="curso-cabecalho"]')).not.toBeNull();
    expect(container.querySelector('[data-section="imagem-texto"]')).not.toBeNull();
    expect(container.querySelector('#perguntas-frequentes + [data-section="perguntas-frequentes"]')).not.toBeNull();
    expect(screen.getAllByRole('link', { name: /Quero me inscrever/ })).toHaveLength(2);
    const outros = container.querySelector('[data-section="catalogo-cursos"]') as HTMLElement;
    expect(within(outros).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['Reset', 'Start']);
    expect(jsonLd(container).map((d) => d['@type'])).toEqual(expect.arrayContaining(['Course', 'BreadcrumbList']));
  });

  it('curso sem inscrição → sem bloco final de inscrição', async () => {
    await renderizarServidor(await CursoPage(params('start')));
    expect(screen.queryByText('Pronto para começar?')).toBeNull();
  });

  it('metadata: título com o nome, canonical do curso; noindex no SEO vira robots index false', async () => {
    const meta = await metadataCurso(params('talmidim'));
    expect(String(meta.title)).toContain('Talmidim');
    expect(meta.alternates?.canonical).toMatch(/\/eba\/cursos\/talmidim$/);
    strapi.cursos.find((c) => c.slug === 'talmidim')!.seo = { id: 1, metaTitle: 'Talmidim', metaRobots: 'noindex' } as never;
    expect((await metadataCurso(params('talmidim'))).robots).toMatchObject({ index: false });
  });

  it('SEO parcial (sem imagem) → o compartilhamento usa a capa do curso', async () => {
    strapi.cursos.find((c) => c.slug === 'talmidim')!.seo = { id: 1, metaTitle: 'Talmidim — EBA', metaDescription: 'Curso para adolescentes.' } as never;
    const meta = await metadataCurso(params('talmidim'));
    expect(String(meta.title)).toContain('Talmidim — EBA');
    expect(JSON.stringify(meta.openGraph?.images)).toContain('talmidim_capa.webp');
  });

  it('SEO com título vazio no Strapi → usa o título padrão do curso', async () => {
    strapi.cursos.find((c) => c.slug === 'talmidim')!.seo = { id: 1, metaTitle: null, metaDescription: 'Curso para adolescentes.' } as never;
    expect(String((await metadataCurso(params('talmidim'))).title)).toContain('Talmidim — Cursos da EBA');
  });

  it.each([['Reset'], ['a..b'], ['cdv-é']])('endereço fora do padrão (%p) → 404 sem chamar o Strapi', async (slug) => {
    expect((await erroDe(CursoPage(params(slug)))).digest).toBe('NEXT_HTTP_ERROR_FALLBACK;404');
    expect(strapi.fetch).not.toHaveBeenCalled();
  });

  it('curso inexistente → 404', async () => {
    expect((await erroDe(CursoPage(params('nao-existe')))).digest).toBe('NEXT_HTTP_ERROR_FALLBACK;404');
  });

  it('Strapi fora do ar → erro (vai para o error.tsx), nunca 404', async () => {
    strapi.foraDoAr(503);
    const erro = await erroDe(CursoPage(params('talmidim')));
    expect(erro.digest).not.toBe('NEXT_HTTP_ERROR_FALLBACK;404');
    expect(erro.message).toBeDefined();
  });
});
