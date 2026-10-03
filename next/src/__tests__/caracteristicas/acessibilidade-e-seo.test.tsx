/**
 * Característica: acessibilidade (WCAG 2.2 AA estrutural) e SEO valem para **todo** componente,
 * em **toda** variante da vitrine, e para as páginas montadas do Strapi.
 * Componente novo entra aqui sozinho (pelo catálogo da vitrine) — não precisa editar este arquivo.
 */
import { render } from '@testing-library/react';
import { draftMode } from 'next/headers';
import HomePage from '@/app/(site)/page';
import SlugPage from '@/app/(site)/[slug]/page';
import SiteLayout from '@/app/(site)/layout';
import { proximosEventosShowcase } from '@/components/sections/ProximosEventosSection/ProximosEventosSection.showcase';
import type { ProximosEventosExemplo } from '@/components/sections/ProximosEventosSection/types';
import { serieAtualShowcase } from '@/components/sections/SerieAtualSection/SerieAtualSection.showcase';
import type { SerieAtualExemplo } from '@/components/sections/SerieAtualSection/types';
import { getEventosInchurch } from '@/lib/inchurch/eventos-cache';
import { showcaseCatalog } from '@/lib/showcase/catalog';
import { getAoVivoAtual, getSerieAtual } from '@/lib/youtube/serie-atual';
import { auditarAcessibilidade, auditarTitulos } from '@/test-utils/auditoria';
import { fixarRelogio, renderizarServidor } from '@/test-utils/servidor';
import { criarStrapiFake } from '@/test-utils/strapi-fake';

jest.mock('next/headers', () => ({ draftMode: jest.fn(), headers: jest.fn(async () => new Headers({ 'x-nonce': 'nonce-de-teste' })) }));
jest.mock('@/lib/youtube/serie-atual', () => ({ getSerieAtual: jest.fn(), getAoVivoAtual: jest.fn() }));
jest.mock('@/lib/inchurch/eventos-cache', () => ({ getEventosInchurch: jest.fn() }));

const variantes = showcaseCatalog.flatMap((entry) => entry.variantes.map((v) => [entry.slug, v.nome, entry, v.data] as const));

describe('todo componente, em toda variante da vitrine', () => {
  it.each(variantes)('%s / %s', (_slug, _variante, entry, data) => {
    const { container } = render(<>{entry.render(data)}</>);
    expect(auditarAcessibilidade(container)).toEqual([]);
  });
});

describe('páginas montadas do Strapi (HTML do servidor)', () => {
  const completo = <T,>(showcase: { variantes: { nome: string; data: unknown }[] }) => showcase.variantes.find((v) => v.nome === 'completo')!.data as T;
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

  it('Home: um h1, sem saltos de título, sem problemas de acessibilidade', async () => {
    const { container } = await renderizarServidor(<SiteLayout>{await HomePage()}</SiteLayout>);
    expect(auditarTitulos(container)).toEqual([]);
    expect(auditarAcessibilidade(container)).toEqual([]);
  });

  it('Política de Privacidade: um h1, sem saltos de título, sem problemas de acessibilidade', async () => {
    const pagina = await SlugPage({ params: Promise.resolve({ slug: 'politica-de-privacidade' }) });
    const { container } = await renderizarServidor(<SiteLayout>{pagina}</SiteLayout>);
    expect(auditarTitulos(container)).toEqual([]);
    expect(auditarAcessibilidade(container)).toEqual([]);
  });

  it('conteúdo das seções vem no HTML do servidor (indexável), não só depois do JavaScript', async () => {
    const { html } = await renderizarServidor(<SiteLayout>{await HomePage()}</SiteLayout>);
    expect(html).toContain('data-section="hero"');
    expect(html).toContain('data-section="perguntas-frequentes"');
  });
});

describe('a auditoria pega os erros que promete pegar', () => {
  it('detecta imagem sem alt, link sem nome, nova aba sem aviso, id repetido e "undefined" na tela', () => {
    document.body.innerHTML = `
      <section data-section="x"><img src="a.jpg"><a href="/a"></a>
      <a href="https://x.com" target="_blank">X</a><p id="d">undefined</p><p id="d"></p></section>`;
    const problemas = auditarAcessibilidade(document.body).join('\n');
    for (const esperado of ['imagem sem alt', 'link sem nome', 'nova aba sem rel', 'nova aba sem aviso', 'id repetido', 'texto quebrado', '<section> sem nome']) {
      expect(problemas).toContain(esperado);
    }
  });

  it('detecta dois h1 e salto de título', () => {
    document.body.innerHTML = '<h1>A</h1><h1>B</h1><h4>C</h4>';
    expect(auditarTitulos(document.body)).toEqual(['a página deve ter exatamente 1 h1 (tem 2)', 'salto de título: h1 → h4 ("C")']);
  });
});
