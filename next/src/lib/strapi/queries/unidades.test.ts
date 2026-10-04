import { getIgrejasInchurch } from './unidades';

const fetchMock = jest.fn();

function resposta(unidades: { igreja_inchurch_id: unknown }[]) {
  return { ok: true, status: 200, json: async () => ({ data: unidades, meta: {} }) } as Response;
}

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock;
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe('getIgrejasInchurch', () => {
  it('devolve os IDs válidos, sem repetição e em ordem', async () => {
    fetchMock.mockResolvedValue(
      resposta([{ igreja_inchurch_id: 31876 }, { igreja_inchurch_id: 30146 }, { igreja_inchurch_id: 30146 }, { igreja_inchurch_id: 0 }, { igreja_inchurch_id: '31875' }]),
    );
    await expect(getIgrejasInchurch()).resolves.toEqual([30146, 31876]);
    const url = decodeURIComponent(fetchMock.mock.calls[0][0]);
    expect(url).toContain('/api/unidades?');
    expect(url).toContain('fields[0]=igreja_inchurch_id');
  });

  it('Strapi fora → lista vazia (a agenda mostra todos os eventos)', async () => {
    fetchMock.mockRejectedValue(new Error('rede'));
    await expect(getIgrejasInchurch()).resolves.toEqual([]);
  });
});
