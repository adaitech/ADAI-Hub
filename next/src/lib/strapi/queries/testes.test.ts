import fixture from '@/lib/eba/__fixtures__/testes.json';
import { StrapiError } from '../client';
import { listarTestesPublicados } from './testes';

const fetchMock = jest.fn();
const ok = (corpo: unknown) => ({ ok: true, status: 200, json: async () => corpo }) as Response;

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock;
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
