/**
 * Característica: medição (GA4/GTM) por página. Para toda página do Strapi (a lista de
 * `criarStrapiFake().paginas`):
 *  - toda seção tem `data-section` (sem ele, `ver_secao` e a `origem` dos cliques não funcionam);
 *  - **todo** link e botão gera `clique_cta` no `window.dataLayer`, com texto, origem e destino sem dado pessoal;
 *  - links que a regra reconhece (visita, mapa, contribuir, app) geram o evento específico.
 * É a automação da regra A4 de `Pull-Request.md` (o que dá para provar sem navegador).
 */
import { render } from '@testing-library/react';
import { draftMode } from 'next/headers';
import HomePage from '@/app/(site)/page';
import SlugPage from '@/app/(site)/[slug]/page';
import SobreNosPage from '@/app/(site)/sobre-nos/[slug]/page';
import EbaPage from '@/app/(site)/eba/page';
import EbaCursosPage from '@/app/(site)/eba/cursos/page';
import EbaSubPage from '@/app/(site)/eba/[slug]/page';
import SiteLayout from '@/app/(site)/layout';
import { RastreadorAnalytics } from '@/components/analytics/RastreadorAnalytics';
import { proximosEventosShowcase } from '@/components/sections/ProximosEventosSection/ProximosEventosSection.showcase';
import type { ProximosEventosExemplo } from '@/components/sections/ProximosEventosSection/types';
import { serieAtualShowcase } from '@/components/sections/SerieAtualSection/SerieAtualSection.showcase';
import type { SerieAtualExemplo } from '@/components/sections/SerieAtualSection/types';
import { getEventosInchurch } from '@/lib/inchurch/eventos-cache';
import { PREFIXO_EBA, PREFIXO_SOBRE_NOS } from '@/lib/paginas/caminho';
import { getAoVivoAtual, getSerieAtual } from '@/lib/youtube/serie-atual';
import { fixarRelogio, renderizarServidor } from '@/test-utils/servidor';
import { criarStrapiFake } from '@/test-utils/strapi-fake';

jest.mock('next/headers', () => ({ draftMode: jest.fn(), headers: jest.fn(async () => new Headers({ 'x-nonce': 'nonce-de-teste' })) }));
jest.mock('next/navigation', () => ({ usePathname: () => '/', useRouter: () => ({ push: jest.fn() }) }));
jest.mock('next/web-vitals', () => ({ useReportWebVitals: jest.fn() }));
jest.mock('@/lib/youtube/serie-atual', () => ({ getSerieAtual: jest.fn(), getAoVivoAtual: jest.fn() }));
jest.mock('@/lib/inchurch/eventos-cache', () => ({ getEventosInchurch: jest.fn() }));

const completo = <T,>(showcase: { variantes: { nome: string; data: unknown }[] }) => showcase.variantes.find((v) => v.nome === 'completo')!.data as T;
const params = (slug: string) => ({ params: Promise.resolve({ slug }) });

function paginaDe(slug: string) {
  if (slug === 'home') return HomePage();
  if (slug.startsWith(PREFIXO_SOBRE_NOS)) return SobreNosPage(params(slug.slice(PREFIXO_SOBRE_NOS.length)));
  if (slug === 'eba') return EbaPage();
  if (slug === 'eba-cursos') return EbaCursosPage();
  if (slug.startsWith(PREFIXO_EBA)) return EbaSubPage(params(slug.slice(PREFIXO_EBA.length)));
  return SlugPage(params(slug));
}

/** Links e botões que o rastreador mede (os de disparo manual, como o player, enviam o próprio evento). */
function clicaveis(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>('a[href], button')).filter((el) => !el.closest('[data-analytics="manual"]'));
}

/** Destino seguro: só o tipo (`mailto:`/`tel:`) ou http(s) sem query string, hash nem e-mail. */
const destinoComDadoPessoal = (destino: string) => /@|[?#]/.test(destino) || /^(mailto|tel):./.test(destino);

describe('medição de toda página do Strapi', () => {
  const slugs = Object.keys(criarStrapiFake().paginas);
  const { inchurch, agora } = completo<ProximosEventosExemplo>(proximosEventosShowcase);

  beforeEach(() => {
    fixarRelogio(agora);
    (draftMode as jest.Mock).mockResolvedValue({ isEnabled: false });
    (getSerieAtual as jest.Mock).mockResolvedValue(completo<SerieAtualExemplo>(serieAtualShowcase).youtube);
    (getAoVivoAtual as jest.Mock).mockResolvedValue('https://www.youtube.com/watch?v=live123');
    (getEventosInchurch as jest.Mock).mockResolvedValue(inchurch);
    globalThis.fetch = criarStrapiFake().fetch;
    window.dataLayer = [];
  });
  afterEach(() => jest.useRealTimers());

  it.each(slugs)('%s: toda seção tem data-section (ver_secao e origem dos cliques dependem dele)', async (slug) => {
    const { container } = await renderizarServidor(<SiteLayout>{await paginaDe(slug)}</SiteLayout>);
    // `header`/`footer` dentro de `main` são títulos internos de uma seção, não o cabeçalho/rodapé do site.
    const semAtributo = Array.from(container.querySelectorAll('main > section, main > article, header, footer'))
      .filter((el) => el.matches('main > *') || !el.closest('main'))
      .filter((el) => !el.hasAttribute('data-section'))
      .map((el) => `<${el.tagName.toLowerCase()} class="${el.className}">`);
    expect(semAtributo).toEqual([]);
  });

  it.each(slugs)('%s: todo link e botão gera clique_cta com origem, texto e destino sem dado pessoal', async (slug) => {
    const { container } = await renderizarServidor(<SiteLayout>{await paginaDe(slug)}</SiteLayout>);
    render(<RastreadorAnalytics />);
    const alvos = clicaveis(container);
    expect(alvos.length).toBeGreaterThan(0);

    const problemas: string[] = [];
    for (const el of alvos) {
      window.dataLayer = [];
      const impedir = (e: Event) => e.preventDefault(); // não navegar
      el.addEventListener('click', impedir);
      el.click();
      el.removeEventListener('click', impedir);

      const nome = (el.getAttribute('aria-label') ?? el.textContent ?? '').replace(/\s+/g, ' ').trim() || el.outerHTML.slice(0, 80);
      const cta = window.dataLayer.find((e) => e.event === 'clique_cta');
      if (!cta) {
        problemas.push(`${nome}: sem clique_cta`);
        continue;
      }
      if (!cta.texto) problemas.push(`${nome}: texto vazio (botão/link sem nome acessível)`);
      const ancoraInterna = el.getAttribute('href')?.startsWith('#'); // "Pular para o conteúdo" não pertence a seção
      if (!ancoraInterna && (!cta.origem || cta.origem === 'pagina')) problemas.push(`${nome}: fora de uma seção com data-section (origem "${String(cta.origem)}")`);
      if (destinoComDadoPessoal(String(cta.destino ?? ''))) problemas.push(`${nome}: destino com possível dado pessoal (${String(cta.destino)})`);
    }
    expect(problemas).toEqual([]);
  });

  it('links de visita, mapa, contribuição e app geram o evento específico, além do clique_cta', async () => {
    const eventosDe = async (slug: string) => {
      const { container } = await renderizarServidor(<SiteLayout>{await paginaDe(slug)}</SiteLayout>);
      render(<RastreadorAnalytics />);
      const nomes = new Set<string>();
      for (const el of clicaveis(container)) {
        window.dataLayer = [];
        const impedir = (e: Event) => e.preventDefault();
        el.addEventListener('click', impedir);
        el.click();
        el.removeEventListener('click', impedir);
        window.dataLayer.forEach((e) => nomes.add(String(e.event)));
      }
      return nomes;
    };
    const home = await eventosDe('home');
    // A Home tem mapa (Neste domingo) e eventos: se a regra parar de reconhecer, o teste avisa.
    expect(home).toEqual(expect.objectContaining(new Set(['clique_cta', 'como_chegar'])));
  });
});
