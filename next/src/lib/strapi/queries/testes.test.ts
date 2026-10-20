import fixture from '@/lib/eba/__fixtures__/testes.json';
import { StrapiError } from '../client';
import { getTesteBySlug, listarTestesPublicados } from './testes';

const rascunho = { isEnabled: false };
jest.mock('next/headers', () => ({ draftMode: async () => rascunho }));

const fetchMock = jest.fn();
const ok = (corpo: unknown) => ({ ok: true, status: 200, json: async () => corpo }) as Response;

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock;
  rascunho.isEnabled = false;
});

describe('listarTestesPublicados', () => {
  it('pede os testes publicados (tag testes) e devolve na ordem do Strapi', async () => {
    fetchMock.mockResolvedValue(ok(fixture));
    const testes = await listarTestesPublicados();
    expect(testes.map((t) => t.slug)).toEqual(['dons-servico', 'temperamento-pessoal', 'talentos-naturais']);
    const url = decodeURIComponent(fetchMock.mock.calls[0][0]);
    expect(url).toContain('/api/testes?');
    expect(url).toContain('pagination[pageSize]=100');
    expect(url).not.toContain('status=draft');
    expect(fetchMock.mock.calls[0][1].next.tags).toEqual(expect.arrayContaining(['strapi', 'testes']));
  });

  it('descarta testes inválidos (sem resumo)', async () => {
    fetchMock.mockResolvedValue(ok({ ...fixture, data: [{ ...fixture.data[0], resumo: '' }, fixture.data[1]] }));
    expect((await listarTestesPublicados()).map((t) => t.slug)).toEqual(['dons-servico']);
  });

  it('Strapi com erro → lança StrapiError', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 } as Response);
    await expect(listarTestesPublicados()).rejects.toBeInstanceOf(StrapiError);
  });
});

describe('getTesteBySlug', () => {
  const doServico = fixture.data.find((t) => t.slug === 'dons-servico')!;

  it('filtra pelo slug (tags testes e teste:<slug>) e devolve o teste normalizado', async () => {
    fetchMock.mockResolvedValue(ok({ ...fixture, data: [doServico] }));
    const teste = await getTesteBySlug('dons-servico');
    expect(teste).toMatchObject({ slug: 'dons-servico', nome: 'Dons de serviço prático', aula: 'Aula 5', perguntas: '55 afirmações' });
    const url = decodeURIComponent(fetchMock.mock.calls[0][0]);
    expect(url).toContain('/api/testes?');
    expect(url).toContain('filters[slug][$eq]=dons-servico');
    expect(url).toContain('pagination[pageSize]=1');
    expect(url).not.toContain('status=draft');
    expect(fetchMock.mock.calls[0][1].next.tags).toEqual(expect.arrayContaining(['strapi', 'testes', 'teste:dons-servico']));
  });

  it('em draft mode pede o rascunho', async () => {
    rascunho.isEnabled = true;
    fetchMock.mockResolvedValue(ok({ ...fixture, data: [doServico] }));
    await getTesteBySlug('dons-servico');
    expect(decodeURIComponent(fetchMock.mock.calls[0][0])).toContain('status=draft');
  });

  it('inexistente ou inválido (sem resumo) → null', async () => {
    fetchMock.mockResolvedValue(ok({ ...fixture, data: [] }));
    expect(await getTesteBySlug('nao-existe')).toBeNull();
    fetchMock.mockResolvedValue(ok({ ...fixture, data: [{ ...doServico, resumo: '' }] }));
    expect(await getTesteBySlug('dons-servico')).toBeNull();
  });

  it('Strapi com erro → lança StrapiError', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 } as Response);
    await expect(getTesteBySlug('dons-servico')).rejects.toBeInstanceOf(StrapiError);
  });
});
