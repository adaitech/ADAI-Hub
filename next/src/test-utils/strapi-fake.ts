import footer from '@/components/layout/Footer/Footer.mock.json';
import header from '@/components/layout/Header/Header.mock.json';
import agendaEventos from '@/components/sections/AgendaEventosSection/AgendaEventosSection.mock.json';
import carrossel from '@/components/sections/CarrosselCardsSection/CarrosselCardsSection.mock.json';
import catalogoCursos from '@/components/sections/CatalogoCursosSection/CatalogoCursosSection.mock.json';
import hero from '@/components/sections/HeroSection/HeroSection.mock.json';
import imagemTexto from '@/components/sections/ImagemTextoSection/ImagemTextoSection.mock.json';
import ministerios from '@/components/sections/MinisteriosSection/MinisteriosSection.mock.json';
import faq from '@/components/sections/PerguntasFrequentesSection/PerguntasFrequentesSection.mock.json';
import proximosEventos from '@/components/sections/ProximosEventosSection/ProximosEventosSection.mock.json';
import serieAtual from '@/components/sections/SerieAtualSection/SerieAtualSection.mock.json';
import textoBotoes from '@/components/sections/TextoBotoesSection/TextoBotoesSection.mock.json';
import textoRico from '@/components/sections/TextoRicoSection/TextoRicoSection.mock.json';
import contribua from '../../../strapi/seed/contribua.json';
import cursosEba from '@/lib/eba/__fixtures__/cursos.json';
import testesEba from '@/lib/eba/__fixtures__/testes.json';

/**
 * Strapi simulado para testes de integração e de característica: responde `/api/pages`,
 * `/api/cursos`, `/api/testes` e `/api/global` com o **mesmo JSON** dos `.mock.json` (que espelham a API real), sem rede.
 *
 * Uso: `const strapi = criarStrapiFake(); globalThis.fetch = strapi.fetch;`
 */

const seo = (titulo: string) => ({ id: 1, metaTitle: titulo, metaDescription: `Descrição de ${titulo} com mais de cinquenta caracteres.` });
const comId = <T extends object>(secao: T, id: number) => ({ ...secao, id });

/** Mesma ordem da Home publicada no Strapi (seed). */
export function secoesHome() {
  return [
    comId(hero.completo, 1),
    comId(carrossel.completo, 2),
    comId(imagemTexto.completo, 3),
    comId(serieAtual.completo, 4),
    comId(proximosEventos.completo, 5),
    comId(ministerios.completo, 6),
    comId(textoBotoes.completo, 7),
    comId(faq.completo, 8),
  ];
}

/** Página de unidade (seed `unidadeSections`), com o JSON dos `.mock.json`. */
export function secoesUnidade() {
  const outras = carrossel.completo.cards.filter((card) => card.titulo !== 'Campestre').map((card) => ({ ...card, destaques: null }));
  return [
    comId(hero.unidade, 11),
    comId({ ...carrossel.so_botao, titulo: 'O que esperar' }, 12),
    comId(ministerios.cards, 13),
    comId(proximosEventos.unidade, 14),
    comId({ ...carrossel.completo, titulo: 'Outras unidades', cards: outras }, 15),
  ];
}

/** Página /agenda: Hero existente, seguido da seção específica de listagem. */
export function secoesAgenda() {
  return [
    comId({ ...hero.unidade, titulo: 'Agenda', subtitulo: null, texto_apoio: 'Confira os próximos eventos, conferências e cultos especiais da ADAI.' }, 31),
    comId(agendaEventos.completo, 32),
  ];
}

/** Tipo Unidades (nome + ID da igreja na inChurch), como o seed cadastra. */
/** Cursos da EBA (fixture no formato da API); o Talmidim tem corpo com Imagem e texto e Perguntas frequentes. */
export function cursosFake() {
  return cursosEba.data.map((curso) =>
    curso.slug === 'talmidim'
      ? { ...curso, secoes: [comId(imagemTexto.completo, 41), comId(faq.completo, 42)] }
      : { ...curso, secoes: [] },
  );
}

export const unidadesFake = [
  { id: 1, documentId: 'u1', nome: 'ADAI Campestre', igreja_inchurch_id: 30146 },
  { id: 2, documentId: 'u2', nome: 'ADAI Santos', igreja_inchurch_id: 31876 },
];

export interface PaginaFake {
  apresentacao?: 'padrao' | 'editorial' | null;
  id: number;
  documentId: string;
  titulo: string;
  slug: string;
  seo: ReturnType<typeof seo> | null;
  sections: { __component: string; id: number }[];
}

export function criarStrapiFake() {
  let idContribua = 500;
  const paginaContribua = JSON.parse(JSON.stringify(contribua), (_key: string, value: unknown) =>
    value && typeof value === 'object' && !Array.isArray(value) ? { ...value, id: idContribua++ } : value,
  ) as PaginaFake;
  paginaContribua.documentId = 'contribua';
  Object.assign(paginaContribua.sections[0], { imagem: imagemTexto.completo.imagem });
  const paginas: Record<string, PaginaFake> = {
    contribua: paginaContribua,
    home: { id: 1, documentId: 'home', titulo: 'Home', slug: 'home', seo: seo('ADAI — Amar. Servir. Influenciar.'), sections: secoesHome() },
    'politica-de-privacidade': {
      id: 2,
      documentId: 'politica',
      titulo: 'Política de Privacidade',
      slug: 'politica-de-privacidade',
      seo: seo('Política de Privacidade e Cookies | ADAI'),
      sections: [comId(textoRico.completo, 9)],
    },
    'sobre-nos-nossa-historia': {
      id: 4,
      documentId: 'nossa-historia',
      titulo: 'Nossa história',
      slug: 'sobre-nos-nossa-historia',
      seo: seo('Nossa história | ADAI'),
      sections: [comId({ ...hero.unidade, titulo: 'Nossa história', subtitulo: null }, 16), comId(textoRico.sem_titulo, 17)],
    },
    campestre: { id: 3, documentId: 'campestre', titulo: 'Campestre', slug: 'campestre', seo: seo('Campestre | ADAI'), sections: secoesUnidade() },
    agenda: { id: 5, documentId: 'agenda', titulo: 'Agenda', slug: 'agenda', seo: seo('Agenda | ADAI'), sections: secoesAgenda() },
    eba: {
      id: 6,
      documentId: 'eba',
      titulo: 'EBA',
      slug: 'eba',
      seo: seo('EBA — Escola Bíblica ADAI | ADAI'),
      sections: [comId({ ...hero.unidade, titulo: 'Escola Bíblica ADAI', subtitulo: null }, 51), comId(catalogoCursos.completo, 52)],
    },
    'eba-cursos': {
      id: 7,
      documentId: 'eba-cursos',
      titulo: 'Cursos da EBA',
      slug: 'eba-cursos',
      seo: seo('Cursos da EBA | ADAI'),
      sections: [comId(catalogoCursos.minimo, 53)],
    },
  };
  const cursos = cursosFake();
  // Testes da EBA (fixture no formato da API): só 3 dos 5 testes, para exercitar o teste sem cadastro.
  const testes = testesEba.data.map((teste) => ({ ...teste }));
  const global = { status: 200, corpo: { data: { header: header.completo, footer: footer.completo, seo: seo('ADAI') } } as unknown };

  const responder = (status: number, corpo: unknown) =>
    Promise.resolve({ ok: status < 400, status, json: async () => corpo } as Response);

  const fetch = jest.fn((url: string) => {
    const endereco = decodeURIComponent(url);
    if (endereco.includes('/api/global')) return responder(global.status, global.corpo);
    if (endereco.includes('/api/unidades')) return responder(200, { data: unidadesFake, meta: {} });
    if (endereco.includes('/api/cursos')) {
      const slugCurso = /filters\[slug\]\[\$eq\]=([^&]+)/.exec(endereco)?.[1];
      const lista = slugCurso === undefined ? cursos : cursos.filter((c) => c.slug === slugCurso);
      return responder(200, { data: lista, meta: { pagination: { page: 1, pageSize: 100, pageCount: 1, total: lista.length } } });
    }
    if (endereco.includes('/api/testes')) {
      const slugTeste = /filters\[slug\]\[\$eq\]=([^&]+)/.exec(endereco)?.[1];
      const lista = slugTeste === undefined ? testes : testes.filter((t) => t.slug === slugTeste);
      return responder(200, { data: lista, meta: { pagination: { page: 1, pageSize: 100, pageCount: 1, total: lista.length } } });
    }
    const slug = /filters\[slug\]\[\$eq\]=([^&]+)/.exec(endereco)?.[1];
    // Sem filtro de slug = listagem (sitemap): todas as páginas, em uma página da paginação.
    if (slug === undefined) {
      const todas = Object.values(paginas).map((p) => ({ ...p, updatedAt: '2026-10-02T12:00:00.000Z' }));
      return responder(200, { data: todas, meta: { pagination: { page: 1, pageSize: 100, pageCount: 1, total: todas.length } } });
    }
    return responder(200, { data: paginas[slug] ? [paginas[slug]] : [], meta: {} });
  });

  return {
    fetch: fetch as unknown as typeof globalThis.fetch & jest.Mock,
    paginas,
    cursos,
    testes,
    global,
    /** Simula o Strapi fora do ar (toda chamada responde com `status`). */
    foraDoAr(status = 503) {
      fetch.mockImplementation(() => responder(status, {}));
    },
    /** URL (decodificada) e opções da chamada a `/api/pages`. */
    chamadaPagina() {
      const chamada = fetch.mock.calls.find(([u]) => decodeURIComponent(u).includes('/api/pages')) as unknown as [string, RequestInit] | undefined;
      return chamada ? { url: decodeURIComponent(chamada[0]), opcoes: chamada[1] } : null;
    },
  };
}

export const mocksStrapi = { serieAtual, textoRico };
