/**
 * Integração ponta a ponta no servidor, sem rede: `page.tsx` → queries do Strapi → `strapiFetch`
 * → (Strapi simulado com o JSON real) → `SectionRenderer` → registry → seções → HTML.
 * Só as integrações externas (YouTube, inChurch) são substituídas por fixtures reais, já
 * normalizadas — as regras delas têm testes próprios em `lib/youtube` e `lib/inchurch`.
 */
import { screen, within } from '@testing-library/react';
import { draftMode } from 'next/headers';
import HomePage, { generateMetadata as metadataHome } from '@/app/(site)/page';
import SlugPage, { generateMetadata as metadataSlug } from '@/app/(site)/[slug]/page';
import SiteLayout from '@/app/(site)/layout';
import { proximosEventosShowcase } from '@/components/sections/ProximosEventosSection/ProximosEventosSection.showcase';
import type { ProximosEventosExemplo } from '@/components/sections/ProximosEventosSection/types';
import { serieAtualShowcase } from '@/components/sections/SerieAtualSection/SerieAtualSection.showcase';
import type { SerieAtualExemplo } from '@/components/sections/SerieAtualSection/types';
import { getEventosInchurch } from '@/lib/inchurch/eventos-cache';
import { sectionRegistry } from '@/lib/registry/sectionRegistry';
import { StrapiError } from '@/lib/strapi/client';
import { getAoVivoAtual, getSerieAtual } from '@/lib/youtube/serie-atual';
import { fixarRelogio, renderizarServidor } from '@/test-utils/servidor';
import { criarStrapiFake, mocksStrapi, secoesHome } from '@/test-utils/strapi-fake';

jest.mock('next/headers', () => ({ draftMode: jest.fn() }));
jest.mock('@/lib/youtube/serie-atual', () => ({ getSerieAtual: jest.fn(), getAoVivoAtual: jest.fn() }));
jest.mock('@/lib/inchurch/eventos-cache', () => ({ getEventosInchurch: jest.fn() }));

const completo = <T,>(showcase: { variantes: { nome: string; data: unknown }[] }) => showcase.variantes.find((v) => v.nome === 'completo')!.data as T;
const { youtube } = completo<SerieAtualExemplo>(serieAtualShowcase);
const { inchurch, agora } = completo<ProximosEventosExemplo>(proximosEventosShowcase);

let strapi: ReturnType<typeof criarStrapiFake>;

beforeEach(() => {
  fixarRelogio(agora);
  jest.clearAllMocks();
  (draftMode as jest.Mock).mockResolvedValue({ isEnabled: false });
  (getSerieAtual as jest.Mock).mockResolvedValue(youtube);
  (getAoVivoAtual as jest.Mock).mockResolvedValue(null);
  (getEventosInchurch as jest.Mock).mockResolvedValue(inchurch);
  strapi = criarStrapiFake();
  globalThis.fetch = strapi.fetch;
});

afterEach(() => {
  jest.useRealTimers();
});

async function erroDe(chamada: Promise<unknown>) {
  return (await chamada.catch((e: unknown) => e)) as { digest?: string };
}

const renderizarHome = async () => renderizarServidor(<SiteLayout>{await HomePage()}</SiteLayout>);
const params = (slug: string) => ({ params: Promise.resolve({ slug }) });

describe('Home (layout + página vindos do Strapi)', () => {
  it('monta todas as seções da Home na ordem do Strapi, entre o Header e o Footer', async () => {
    const { container } = await renderizarHome();
    const ordem = [...container.querySelectorAll('[data-section]')].map((s) => s.getAttribute('data-section'));
    expect(ordem).toEqual([
      'header',
      'hero',
      'carrossel-cards',
      'imagem-texto',
      'serie-atual',
      'proximos-eventos',
      'ministerios',
      'texto-botoes',
      'perguntas-frequentes',
      'footer',
    ]);
  });

  it('estrutura: "pular para o conteúdo" leva ao <main>; um cabeçalho e um rodapé', async () => {
    await renderizarHome();
    expect(screen.getByRole('link', { name: /pular para o conteúdo/i })).toHaveAttribute('href', '#conteudo');
    expect(document.getElementById('conteudo')?.tagName).toBe('MAIN');
    expect(screen.getAllByRole('banner')).toHaveLength(1);
    expect(screen.getAllByRole('contentinfo')).toHaveLength(1);
  });

  it('busca a página "home" com o populate de todas as seções do registry e a tag de cache', async () => {
    await HomePage();
    const { url, opcoes } = strapi.chamadaPagina()!;
    expect(url).toContain('filters[slug][$eq]=home');
    for (const chave of Object.keys(sectionRegistry)) expect(url).toContain(`populate[sections][on][${chave}]`);
    expect(opcoes).toEqual({ headers: expect.any(Object), next: { revalidate: 60, tags: ['strapi', 'page:home'] } });
  });

  it('dados externos entram nas seções: série do YouTube e eventos da inChurch', async () => {
    await renderizarHome();
    const serie = document.querySelector('[data-section=serie-atual]') as HTMLElement;
    expect(within(serie).getByRole('heading', { level: 2 })).toHaveTextContent(mocksStrapi.serieAtual.completo.titulo_personalizado!);
    const eventos = document.querySelector('[data-section=proximos-eventos]') as HTMLElement;
    expect(within(eventos).getAllByRole('listitem').length).toBeGreaterThan(0);
  });

  it('YouTube e inChurch fora do ar (sem cache) → só essas seções somem; a página continua', async () => {
    (getSerieAtual as jest.Mock).mockResolvedValue(null);
    (getEventosInchurch as jest.Mock).mockResolvedValue(null);
    const { container } = await renderizarHome();
    expect(container.querySelector('[data-section=serie-atual]')).toBeNull();
    expect(container.querySelector('[data-section=proximos-eventos]')).toBeNull();
    expect(container.querySelector('[data-section=hero]')).not.toBeNull();
    expect(container.querySelector('[data-section=footer]')).not.toBeNull();
  });

  it('live confirmada → botão "Ao vivo" aparece no cabeçalho', async () => {
    (getAoVivoAtual as jest.Mock).mockResolvedValue('https://www.youtube.com/watch?v=live123');
    await renderizarHome();
    const cabecalho = screen.getByRole('banner');
    expect(within(cabecalho).getAllByRole('link', { name: /ao vivo/i })[0]).toHaveAttribute('href', 'https://www.youtube.com/watch?v=live123');
  });

  it('seção nova no Strapi que o site ainda não conhece é ignorada sem quebrar a página', async () => {
    strapi.paginas.home.sections = [{ __component: 'sections.ainda-nao-existe', id: 99 }, ...secoesHome()];
    const { container } = await renderizarHome();
    expect(container.querySelector('[data-section=hero]')).not.toBeNull();
  });

  it('"Configurações do site" ainda não cadastradas (404) → página renderiza sem quebrar', async () => {
    strapi.global.status = 404;
    const { container } = await renderizarHome();
    expect(container.querySelector('[data-section=hero]')).not.toBeNull();
  });

  it('Strapi fora do ar → erro tipado (a página de erro do Next assume)', async () => {
    strapi.foraDoAr();
    await expect(HomePage()).rejects.toBeInstanceOf(StrapiError);
  });

  it('Home não publicada → 404', async () => {
    delete (strapi.paginas as Record<string, unknown>).home;
    expect((await erroDe(HomePage())).digest).toBe('NEXT_HTTP_ERROR_FALLBACK;404');
  });

  it('draft mode (Pré-visualizar do Strapi) → busca o rascunho, sem cache', async () => {
    (draftMode as jest.Mock).mockResolvedValue({ isEnabled: true });
    await HomePage();
    const { url, opcoes } = strapi.chamadaPagina()!;
    expect(url).toContain('status=draft');
    expect(opcoes).toMatchObject({ cache: 'no-store' });
  });

  it('SEO da Home vem do Strapi, com canonical "/"', async () => {
    const meta = await metadataHome();
    expect(meta.title).toBe('ADAI — Amar. Servir. Influenciar.');
    expect(meta.alternates?.canonical).toBe('/');
  });
});

describe('Página por slug ([slug])', () => {
  it('/politica-de-privacidade: documento com h1, título no SEO e canonical do caminho', async () => {
    await renderizarServidor(<SiteLayout>{await SlugPage(params('politica-de-privacidade'))}</SiteLayout>);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Política de Privacidade e Cookies');
    const meta = await metadataSlug(params('politica-de-privacidade'));
    expect(meta.title).toBe('Política de Privacidade e Cookies | ADAI');
    expect(meta.alternates?.canonical).toBe('/politica-de-privacidade');
  });

  it('slug sem página no Strapi → 404 com título próprio e fora do Google', async () => {
    expect((await erroDe(SlugPage(params('nao-existe')))).digest).toBe('NEXT_HTTP_ERROR_FALLBACK;404');
    expect(await metadataSlug(params('nao-existe'))).toEqual({ title: 'Página não encontrada | ADAI', robots: { index: false } });
  });

  it('/home redireciona para "/" (um endereço só para a Home)', async () => {
    expect((await erroDe(SlugPage(params('home')))).digest).toMatch(/^NEXT_REDIRECT;replace;\/;307;/);
  });

  it('página sem SEO próprio usa o SEO padrão de "Configurações do site"', async () => {
    strapi.paginas['politica-de-privacidade'].seo = null;
    const meta = await metadataSlug(params('politica-de-privacidade'));
    expect(meta.title).toBe('ADAI');
  });
});
