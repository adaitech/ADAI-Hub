/**
 * Característica: SEO por página. Toda página do Strapi (a lista de `criarStrapiFake().paginas`, que
 * espelha as páginas reais) precisa ter título, descrição, canonical e Open Graph coerentes com o
 * seu endereço, e um único h1. Página nova entra aqui ao ser cadastrada no `strapi-fake`.
 */
import { draftMode } from 'next/headers';
import HomePage, { generateMetadata as metadataHome } from '@/app/(site)/page';
import SlugPage, { generateMetadata as metadataSlug } from '@/app/(site)/[slug]/page';
import SobreNosPage, { generateMetadata as metadataSobreNos } from '@/app/(site)/sobre-nos/[slug]/page';
import SiteLayout from '@/app/(site)/layout';
import { proximosEventosShowcase } from '@/components/sections/ProximosEventosSection/ProximosEventosSection.showcase';
import type { ProximosEventosExemplo } from '@/components/sections/ProximosEventosSection/types';
import { serieAtualShowcase } from '@/components/sections/SerieAtualSection/SerieAtualSection.showcase';
import type { SerieAtualExemplo } from '@/components/sections/SerieAtualSection/types';
import { getEventosInchurch } from '@/lib/inchurch/eventos-cache';
import { buildMetadata } from '@/lib/metadata';
import { caminhoDaPagina, PREFIXO_SOBRE_NOS } from '@/lib/paginas/caminho';
import { getAoVivoAtual, getSerieAtual } from '@/lib/youtube/serie-atual';
import { auditarTitulos } from '@/test-utils/auditoria';
import { fixarRelogio, renderizarServidor } from '@/test-utils/servidor';
import { criarStrapiFake } from '@/test-utils/strapi-fake';

jest.mock('next/headers', () => ({ draftMode: jest.fn(), headers: jest.fn(async () => new Headers({ 'x-nonce': 'nonce-de-teste' })) }));
jest.mock('@/lib/youtube/serie-atual', () => ({ getSerieAtual: jest.fn(), getAoVivoAtual: jest.fn() }));
jest.mock('@/lib/inchurch/eventos-cache', () => ({ getEventosInchurch: jest.fn() }));

const completo = <T,>(showcase: { variantes: { nome: string; data: unknown }[] }) => showcase.variantes.find((v) => v.nome === 'completo')!.data as T;
const params = (slug: string) => ({ params: Promise.resolve({ slug }) });

/** Mesma escolha de rota do site: Home, `/sobre-nos/<x>` ou `/<slug>`. */
function rotaDe(slug: string) {
  if (slug === 'home') return { pagina: () => HomePage(), metadata: () => metadataHome() };
  if (slug.startsWith(PREFIXO_SOBRE_NOS)) {
    const segmento = slug.slice(PREFIXO_SOBRE_NOS.length);
    return { pagina: () => SobreNosPage(params(segmento)), metadata: () => metadataSobreNos(params(segmento)) };
  }
  return { pagina: () => SlugPage(params(slug)), metadata: () => metadataSlug(params(slug)) };
}

describe('SEO de toda página do Strapi', () => {
  const slugs = Object.keys(criarStrapiFake().paginas);
  const { inchurch, agora } = completo<ProximosEventosExemplo>(proximosEventosShowcase);

  beforeEach(() => {
    fixarRelogio(agora);
    (draftMode as jest.Mock).mockResolvedValue({ isEnabled: false });
    (getSerieAtual as jest.Mock).mockResolvedValue(completo<SerieAtualExemplo>(serieAtualShowcase).youtube);
    (getAoVivoAtual as jest.Mock).mockResolvedValue('https://www.youtube.com/watch?v=live123');
    (getEventosInchurch as jest.Mock).mockResolvedValue(inchurch);
    globalThis.fetch = criarStrapiFake().fetch;
  });
  afterEach(() => jest.useRealTimers());

  it.each(slugs)('%s: título, descrição, canonical e Open Graph coerentes com o endereço', async (slug) => {
    const meta = await rotaDe(slug).metadata();
    const caminho = caminhoDaPagina(slug);
    const titulo = String(meta.title);

    expect(titulo.trim().length).toBeGreaterThan(0);
    expect(titulo.length).toBeLessThanOrEqual(70);
    expect(typeof meta.description).toBe('string');
    expect(String(meta.description).length).toBeGreaterThanOrEqual(50);
    expect(String(meta.description).length).toBeLessThanOrEqual(160);
    expect(meta.alternates?.canonical).toBe(caminho);
    expect(meta.openGraph).toMatchObject({ title: titulo, url: caminho, locale: 'pt_BR' });
    expect(meta.robots).toBeUndefined(); // página pública não nasce com noindex
  });

  it.each(slugs)('%s: um único h1 e sem saltos de título no HTML do servidor', async (slug) => {
    const { container } = await renderizarServidor(<SiteLayout>{await rotaDe(slug).pagina()}</SiteLayout>);
    expect(auditarTitulos(container)).toEqual([]);
  });

  it('títulos e descrições não se repetem entre páginas (cada URL com o seu)', async () => {
    const metas = await Promise.all(slugs.map((slug) => rotaDe(slug).metadata()));
    const titulos = metas.map((m) => String(m.title));
    const descricoes = metas.map((m) => String(m.description));
    expect(new Set(titulos).size).toBe(titulos.length);
    expect(new Set(descricoes).size).toBe(descricoes.length);
  });
});

describe('buildMetadata (regra de reserva)', () => {
  it('página sem SEO usa o SEO padrão do site e mantém o canonical do caminho', () => {
    const meta = buildMetadata(null, { id: 1, metaTitle: 'ADAI', metaDescription: 'Descrição padrão do site da ADAI para páginas sem SEO próprio.' }, '/exemplo');
    expect(meta.title).toBe('ADAI');
    expect(meta.alternates?.canonical).toBe('/exemplo');
    expect(meta.openGraph).toMatchObject({ url: '/exemplo' });
  });

  it('só marca noindex quando a própria página pede (nunca herda do padrão do site)', () => {
    const noindex = buildMetadata({ id: 1, metaTitle: 'X', metaRobots: 'noindex, follow' }, { id: 2, metaTitle: 'ADAI' }, '/x');
    expect(noindex.robots).toMatchObject({ index: false, follow: true });
    const herdado = buildMetadata({ id: 1, metaTitle: 'X' }, { id: 2, metaTitle: 'ADAI', metaRobots: 'noindex' }, '/x');
    expect(herdado.robots).toBeUndefined();
  });
});
