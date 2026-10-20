import { getIgrejasInchurch, getUnidadesInchurch } from './unidades';

const fetchMock = jest.fn();

function resposta(unidades: { nome?: unknown; igreja_inchurch_id: unknown }[]) {
  return { ok: true, status: 200, json: async () => ({ data: unidades, meta: {} }) } as Response;
}

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock;
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe('getUnidadesInchurch', () => {
  it('devolve nome e ID válidos, sem repetição e em ordem de ID', async () => {
    fetchMock.mockResolvedValue(
      resposta([
        { nome: 'ADAI Santos', igreja_inchurch_id: 31876 },
        { nome: ' ADAI Campestre ', igreja_inchurch_id: 30146 },
        { nome: 'Outra unidade', igreja_inchurch_id: 30146 },
        { nome: '', igreja_inchurch_id: 900 },
        { nome: 'Inválida', igreja_inchurch_id: 0 },
        { nome: 'Texto', igreja_inchurch_id: '31875' },
      ]),
    );
    await expect(getUnidadesInchurch()).resolves.toEqual([
      { nome: 'ADAI Campestre', igrejaId: 30146 },
      { nome: 'ADAI Santos', igrejaId: 31876 },
    ]);
    const url = decodeURIComponent(fetchMock.mock.calls[0][0]);
    expect(url).toContain('/api/unidades?');
    expect(url).toContain('fields[0]=nome');
    expect(url).toContain('fields[1]=igreja_inchurch_id');
  });

  it('mantém a função de IDs para os consumidores atuais', async () => {
    fetchMock.mockResolvedValue(resposta([
      { nome: 'ADAI Santos', igreja_inchurch_id: 31876 },
      { nome: 'ADAI Campestre', igreja_inchurch_id: 30146 },
    ]));
    await expect(getIgrejasInchurch()).resolves.toEqual([30146, 31876]);
  });

  it('Strapi fora → lista vazia (a agenda mostra todos os eventos)', async () => {
    fetchMock.mockRejectedValue(new Error('rede'));
    await expect(getUnidadesInchurch()).resolves.toEqual([]);
  });
});
