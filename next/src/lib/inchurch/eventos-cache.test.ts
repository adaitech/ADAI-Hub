/** @jest-environment node */
import fixture from './__fixtures__/eventos.json';
import { inchurchFetch } from './client';
import { __limparUltimoValido, getEventosInchurch } from './eventos-cache';

// `next/cache` vira chamada direta em jest.setup.ts.
jest.mock('./client', () => ({ ...jest.requireActual('./client'), inchurchFetch: jest.fn() }));
const api = inchurchFetch as jest.MockedFunction<typeof inchurchFetch>;

describe('getEventosInchurch', () => {
  let warn: jest.SpyInstance;
  let info: jest.SpyInstance;
  beforeEach(() => {
    __limparUltimoValido();
    api.mockReset();
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    info = jest.spyOn(console, 'info').mockImplementation(() => {});
  });
  afterEach(() => {
    warn.mockRestore();
    info.mockRestore();
  });

  function inchurchOk() {
    api.mockImplementation(async (_endpoint, params = []) => {
      const gc = params.some(([k]) => k === 'category_id');
      const igreja = params.find(([k]) => k === 'church_id')?.[1];
      const results = igreja
        ? fixture.results.filter((e) => igreja === 31876 && e.name === 'The Chosen')
        : gc
          ? fixture.results.filter((e) => fixture.idsCategoriaGc.includes(e.id))
          : fixture.results;
      return { count: results.length, next: null, results } as never;
    });
  }

  it('busca todos os eventos + os da categoria GC e normaliza', async () => {
    inchurchOk();
    const dados = await getEventosInchurch();
    expect(dados?.eventos.length).toBeGreaterThan(0);
    expect(api).toHaveBeenCalledWith('v1/event/', expect.arrayContaining([['category_id', 8776]]));
  });

  it('inChurch fora com resultado anterior → último válido; sem anterior → null', async () => {
    api.mockRejectedValue(new Error('[inchurch] v1/event/: limite 429'));
    await expect(getEventosInchurch()).resolves.toBeNull();
    inchurchOk();
    const bom = await getEventosInchurch();
    api.mockRejectedValue(new Error('[inchurch] v1/event/: timeout'));
    await expect(getEventosInchurch()).resolves.toEqual(bom);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('último resultado válido'));
  });

  it('busca os eventos de cada igreja cadastrada e grava a igreja no evento', async () => {
    inchurchOk();
    const dados = await getEventosInchurch([30146, 31876]);
    expect(api).toHaveBeenCalledWith('v1/event/', expect.arrayContaining([['church_id', 30146]]));
    expect(api).toHaveBeenCalledWith('v1/event/', expect.arrayContaining([['church_id', 31876]]));
    expect(dados?.eventos.find((e) => e.nome === 'The Chosen')?.igrejaId).toBe(31876);
    expect(dados?.eventos.filter((e) => e.igrejaId === null).length).toBe((dados?.eventos.length ?? 0) - 1);
  });

  it('sem igrejas cadastradas, nenhuma busca por church_id', async () => {
    inchurchOk();
    await getEventosInchurch();
    expect(api.mock.calls.some(([, params = []]) => params.some(([k]) => k === 'church_id'))).toBe(false);
  });

  it('falha na busca de uma igreja → nada de resultado parcial: usa o último válido', async () => {
    inchurchOk();
    const bom = await getEventosInchurch([31876]);
    api.mockImplementation(async (_e, params = []) => {
      if (params.some(([k]) => k === 'church_id')) throw new Error('[inchurch] v1/event/: timeout');
      return { count: 0, next: null, results: fixture.results } as never;
    });
    await expect(getEventosInchurch([31876])).resolves.toEqual(bom);
  });
});
