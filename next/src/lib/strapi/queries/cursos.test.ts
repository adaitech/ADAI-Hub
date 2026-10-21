import fixture from '@/lib/eba/__fixtures__/cursos.json';
import { StrapiError } from '../client';
import { getCursoBySlug, listarCursosParaSitemap, listarCursosPublicados } from './cursos';

const rascunho = { isEnabled: false };
jest.mock('next/headers', () => ({ draftMode: async () => rascunho }));

const fetchMock = jest.fn();
const ok = (corpo: unknown) => ({ ok: true, status: 200, json: async () => corpo }) as Response;
const urlDa = (chamada: number) => decodeURIComponent(fetchMock.mock.calls[chamada][0]);

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock;
  rascunho.isEnabled = false;
});

describe('listarCursosPublicados', () => {
  it('pede cursos com capa e inscrição e devolve os cards ordenados', async () => {
    fetchMock.mockResolvedValue(ok(fixture));
    const cursos = await listarCursosPublicados();
    expect(cursos.map((c) => c.slug)).toEqual(['reset', 'start', 'talmidim']);
    const url = urlDa(0);
    expect(url).toContain('/api/cursos?');
    expect(url).toContain('populate[capa]=true');
    expect(url).toContain('populate[inscricao]=true');
    expect(url).not.toContain('status=draft');
    expect(fetchMock.mock.calls[0][1].next.tags).toEqual(expect.arrayContaining(['strapi', 'cursos']));
  });

  it('descarta cursos inválidos (sem resumo)', async () => {
    fetchMock.mockResolvedValue(ok({ ...fixture, data: [{ ...fixture.data[0], resumo: '' }, fixture.data[1]] }));
    expect((await listarCursosPublicados()).map((c) => c.slug)).toEqual(['reset']);
  });

  it('Strapi com erro → lança StrapiError (quem chama decide o que mostrar)', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 } as Response);
    await expect(listarCursosPublicados()).rejects.toBeInstanceOf(StrapiError);
  });
});

describe('getCursoBySlug', () => {
  it('filtra pelo slug e popula as 4 seções permitidas do corpo e a imagem do SEO', async () => {
    fetchMock.mockResolvedValue(ok({ data: [fixture.data[0]], meta: {} }));
    expect((await getCursoBySlug('talmidim'))?.nome).toBe('Talmidim');
    const url = urlDa(0);
    expect(url).toContain('filters[slug][$eq]=talmidim');
    for (const secao of ['sections.imagem-texto', 'sections.texto-rico', 'sections.perguntas-frequentes', 'sections.texto-botoes']) {
      expect(url).toContain(`populate[secoes][on][${secao}]`);
    }
    expect(url).not.toContain('populate[secoes][on][sections.hero]');
    expect(url).toContain('populate[seo][populate][metaImage]=true');
    expect(fetchMock.mock.calls[0][1].next.tags).toContain('curso:talmidim');
  });

  it('em draft mode busca o rascunho sem cache', async () => {
    rascunho.isEnabled = true;
    fetchMock.mockResolvedValue(ok({ data: [fixture.data[0]], meta: {} }));
    await getCursoBySlug('talmidim');
    expect(urlDa(0)).toContain('status=draft');
    expect(fetchMock.mock.calls[0][1].cache).toBe('no-store');
  });

  it('curso inexistente → null; erro do Strapi → lança (não vira 404)', async () => {
    fetchMock.mockResolvedValueOnce(ok({ data: [], meta: {} }));
    await expect(getCursoBySlug('nao-existe')).resolves.toBeNull();
    fetchMock.mockResolvedValueOnce({ ok: false, status: 503 } as Response);
    await expect(getCursoBySlug('reset')).rejects.toBeInstanceOf(StrapiError);
  });
});

describe('listarCursosParaSitemap', () => {
  it('pede só slug, data e SEO de robots/canonical dos cursos publicados', async () => {
    fetchMock.mockResolvedValue(ok({ data: [{ slug: 'reset', updatedAt: '2026-10-18T12:00:00.000Z', seo: null }], meta: { pagination: { page: 1, pageCount: 1 } } }));
    await expect(listarCursosParaSitemap()).resolves.toEqual([{ slug: 'reset', updatedAt: '2026-10-18T12:00:00.000Z', seo: null }]);
    const url = urlDa(0);
    expect(url).toContain('/api/cursos?');
    expect(url).toContain('fields[0]=slug');
    expect(url).toContain('populate[seo][fields][0]=metaRobots');
  });
});
