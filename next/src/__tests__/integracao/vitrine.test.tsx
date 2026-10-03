/**
 * Integração da vitrine `/componentes` (rotas do App Router + catálogo + guia do editor).
 * O catálogo em si (variantes, controles, guia × mock) é coberto por `lib/showcase/catalog.test.tsx`.
 */
import { screen } from '@testing-library/react';
import ComponentePage, { generateMetadata, generateStaticParams } from '@/app/componentes/(vitrine)/[slug]/page';
import VitrineIndex from '@/app/componentes/(vitrine)/page';
import ComponentesLayout from '@/app/componentes/layout';
import PreviewPage from '@/app/componentes/preview/[slug]/page';
import { showcaseCatalog } from '@/lib/showcase/catalog';
import { renderizarServidor } from '@/test-utils/servidor';

const ambiente = process.env as Record<string, string | undefined>;
const original = { NODE_ENV: ambiente.NODE_ENV, SHOW_COMPONENTS: ambiente.SHOW_COMPONENTS };
afterEach(() => Object.assign(ambiente, original));

const params = (slug: string) => Promise.resolve({ slug });
const erroDe = async (chamada: Promise<unknown>) => ((await chamada.catch((e: unknown) => e)) as { digest?: string }).digest;
const slugs = showcaseCatalog.map((entry) => entry.slug);

describe('acesso à vitrine', () => {
  it('produção sem SHOW_COMPONENTS=true → 404 (a vitrine nunca vai ao ar por engano)', () => {
    ambiente.NODE_ENV = 'production';
    delete ambiente.SHOW_COMPONENTS;
    expect(() => ComponentesLayout({ children: 'conteúdo' })).toThrow(expect.objectContaining({ digest: 'NEXT_HTTP_ERROR_FALLBACK;404' }));
  });

  it('homologação com SHOW_COMPONENTS=true e dev local → abre', () => {
    ambiente.NODE_ENV = 'production';
    ambiente.SHOW_COMPONENTS = 'true';
    expect(ComponentesLayout({ children: 'conteúdo' })).toBe('conteúdo');
    ambiente.NODE_ENV = 'development';
    delete ambiente.SHOW_COMPONENTS;
    expect(ComponentesLayout({ children: 'conteúdo' })).toBe('conteúdo');
  });
});

describe('/componentes', () => {
  it('lista todos os componentes do catálogo com link para a página de cada um', async () => {
    await renderizarServidor(<VitrineIndex />);
    const links = screen.getAllByRole('link');
    for (const entry of showcaseCatalog) {
      const link = links.find((l) => l.getAttribute('href') === `/componentes/${entry.slug}`);
      expect(link).toHaveTextContent(entry.nome);
    }
  });

  it('gera uma página estática por componente', () => {
    expect(generateStaticParams().map((p) => p.slug)).toEqual(slugs);
  });
});

describe.each(slugs)('/componentes/%s', (slug) => {
  const entry = showcaseCatalog.find((e) => e.slug === slug)!;

  it('página do componente: um h1 com o nome e título próprio na aba', async () => {
    await renderizarServidor(await ComponentePage({ params: params(slug) }));
    const titulos = screen.getAllByRole('heading', { level: 1 });
    expect(titulos).toHaveLength(1);
    expect(titulos[0]).toHaveTextContent(entry.nome);
    expect((await generateMetadata({ params: params(slug) })).title).toBe(`${entry.nome} · Vitrine de componentes`);
  });

  it('preview (iframe 375/768/1440): no máximo um h1 e <main> com nome acessível', async () => {
    for (const variante of entry.variantes) {
      const { container } = await renderizarServidor(await PreviewPage({ params: params(slug), searchParams: Promise.resolve({ variante: variante.nome }) }));
      expect(container.querySelectorAll('h1').length).toBeLessThanOrEqual(1);
      expect(container.querySelector('main')).toHaveAttribute('aria-label', `Pré-visualização: ${entry.nome} — ${variante.titulo}`);
    }
  });
});

describe('rotas inexistentes', () => {
  it('componente desconhecido → 404 na página e no preview', async () => {
    expect(await erroDe(ComponentePage({ params: params('nao-existe') }))).toBe('NEXT_HTTP_ERROR_FALLBACK;404');
    expect(await erroDe(PreviewPage({ params: params('nao-existe'), searchParams: Promise.resolve({}) }))).toBe('NEXT_HTTP_ERROR_FALLBACK;404');
  });

  it('variante desconhecida no preview → mostra a primeira (link antigo não quebra)', async () => {
    const entry = showcaseCatalog[0];
    const { container } = await renderizarServidor(await PreviewPage({ params: params(entry.slug), searchParams: Promise.resolve({ variante: 'apagada' }) }));
    expect(container.querySelector('main')).toHaveAttribute('aria-label', `Pré-visualização: ${entry.nome} — ${entry.variantes[0].titulo}`);
  });
});
