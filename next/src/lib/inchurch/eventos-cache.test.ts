/** @jest-environment node */
import fixture from './__fixtures__/eventos.json';
import { inchurchFetch, InchurchError } from './client';
import { __limparUltimoValido, getEventoDetalhe, getEventosInchurch } from './eventos-cache';
import { getUnidadesInchurch } from '@/lib/strapi/queries/unidades';
import { getEventoAdministrativo } from './admin-client';
import administrativo from './__fixtures__/evento-admin.json';

// `next/cache` vira chamada direta em jest.setup.ts.
jest.mock('./client', () => ({ ...jest.requireActual('./client'), inchurchFetch: jest.fn() }));
const api = inchurchFetch as jest.MockedFunction<typeof inchurchFetch>;
jest.mock('@/lib/strapi/queries/unidades', () => ({ getUnidadesInchurch: jest.fn(async () => []) }));
const getUnidades = jest.mocked(getUnidadesInchurch);
jest.mock('./admin-client', () => ({ getEventoAdministrativo: jest.fn() }));
const admin = jest.mocked(getEventoAdministrativo);

describe('getEventosInchurch', () => {
  it('recupera também eventos iniciados antes de hoje, sem perder futuros sem término nem duplicar IDs', async () => {
    const futuro = { id: 700, name: 'Sem término', active: true, enabled: true, start_datetime: '2099-01-01T10:00:00', end_datetime: null };
    const emAndamento = { id: 701, name: 'Vários dias', active: true, enabled: true, start_datetime: '2020-01-01T10:00:00', end_datetime: '2099-01-01T11:00:00' };
    api.mockImplementation(async (_endpoint, params = []) => ({ results: params.some(([k]) => k === 'category_id') ? [] : params.some(([k]) => k === 'end_after') ? [emAndamento, futuro] : [futuro], next: null }) as never);
    expect((await getEventosInchurch())?.eventos.map(e => e.id)).toEqual([701, 700]);
    expect(api).toHaveBeenCalledWith('v1/event/', expect.arrayContaining([['end_after', expect.any(String)], ['start_before', expect.any(String)]]));
  });
  it('GC histórico de nome comum não abre pelo detalhe, mesmo fora da lista futura', async () => {
    const raw = { id: 600, name: 'Encontro de amigos', active: true, enabled: true, start_datetime: '2020-01-01T10:00:00', end_datetime: '2020-01-01T11:00:00' };
    api.mockImplementation(async (endpoint, params = []) => {
      if (endpoint === 'v1/event/600/') return raw as never;
      return { results: params.some(([k, v]) => k === 'start_after' && v === '2020-01-01T00:00:00') ? [raw] : [], next: null } as never;
    });
    expect(await getEventoDetalhe(600)).toEqual({ estado: 'nao-encontrado' });
    expect(admin).not.toHaveBeenCalled();
    expect(api).toHaveBeenCalledWith('v1/event/', expect.arrayContaining([['category_id', 8776], ['start_before', '2020-01-02T00:00:00']]));
  });
  it('falha ao confirmar categoria histórica não libera conteúdo nem vira 404', async () => {
    api.mockImplementation(async (endpoint, params = []) => {
      if (endpoint === 'v1/event/601/') return { id: 601, name: 'Evento antigo', active: true, enabled: true, start_datetime: '2020-01-01T10:00:00' } as never;
      if (params.some(([k, v]) => k === 'start_after' && v === '2020-01-01T00:00:00')) throw new InchurchError('timeout', 'v1/event/');
      return { results: [], next: null } as never;
    });
    expect(await getEventoDetalhe(601)).toEqual({ estado: 'indisponivel' });
    expect(admin).not.toHaveBeenCalled();
  });
  it.each([{}, { results: [], next: '/mais-resultados' }])('confirmação histórica incompleta não libera evento: %j', async (resposta) => {
    api.mockImplementation(async (endpoint, params = []) => {
      if (endpoint === 'v1/event/602/') return { id: 602, name: 'Evento antigo', active: true, enabled: true, start_datetime: '2020-01-01T10:00:00' } as never;
      if (params.some(([k, v]) => k === 'start_after' && v === '2020-01-01T00:00:00')) return resposta as never;
      return { results: [], next: null } as never;
    });
    expect(await getEventoDetalhe(602)).toEqual({ estado: 'indisponivel' });
    expect(admin).not.toHaveBeenCalled();
  });
  let warn: jest.SpyInstance;
  let info: jest.SpyInstance;
  beforeEach(() => {
    __limparUltimoValido();
    api.mockReset();
    getUnidades.mockResolvedValue([]);
    admin.mockReset();
    admin.mockImplementation(async (id) => ({ id }));
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    info = jest.spyOn(console, 'info').mockImplementation(() => {});
  });
  afterEach(() => {
    jest.restoreAllMocks();
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

  it('acumula igrejas confirmadas sem sobrescrever a associação anterior nem duplicar o evento', async () => {
    const raw = fixture.results.find((e) => e.active && e.enabled && !e.recurrence_model && !/^GC\b/.test(e.name))!;
    api.mockImplementation(async (_endpoint, params = []) => ({ results: params.some(([k]) => k === 'category_id') ? [] : [raw], next: null }) as never);
    const dados = await getEventosInchurch([30146, 31876]);
    expect(dados?.eventos).toHaveLength(1);
    expect(dados?.eventos[0]).toMatchObject({ igrejaIds: [30146, 31876] });
    // Duas janelas temporais por consulta: futuros e iniciados antes de hoje ainda em andamento.
    expect(api).toHaveBeenCalledTimes(8);
  });
  it('units administrativas resolvem as duas igrejas mesmo sem correspondência nos filtros públicos', async () => {
    const base = fixture.results.find((e) => e.active && e.enabled && !e.recurrence_model && !/^GC\b/.test(e.name))!;
    const raw = { ...base, id: 1646183, name: 'HACKATHON ADAI HUB' };
    api.mockImplementation(async (_endpoint, params = []) => ({ results: params.some(([k]) => k === 'category_id' || k === 'church_id') ? [] : [raw, { ...raw, id: 999, enabled: false }], next: null }) as never);
    admin.mockResolvedValue({ id: raw.id, units: [
      { id: 34726, name: 'ADAI CAMPESTRE', related_obj: { id: 30146, model: 'inradartertiarygroup', name: 'ADAI CAMPESTRE' } },
      { id: 34728, name: 'ADAI SANTOS', related_obj: { id: 31876, model: 'inradartertiarygroup', name: 'ADAI SANTOS' } },
    ] });
    expect((await getEventosInchurch([30146, 31876]))?.eventos).toEqual([expect.objectContaining({ id: raw.id, igrejaIds: [30146, 31876] })]);
    expect(admin).not.toHaveBeenCalledWith(999);
  });

  it('Connect Pulse publicado na API pública não vira 404 com is_public=false e listas administrativas vazias', async () => {
    const raw = fixture.results.find((e) => e.id === 1635364)!;
    api.mockImplementation(async (endpoint) => endpoint === `v1/event/${raw.id}/` ? raw as never : { results: [], next: null } as never);
    admin.mockResolvedValue({ id: raw.id, is_enabled: true, is_public: false, event_schedule: [], event_attractions: [] });
    expect(await getEventoDetalhe(raw.id)).toMatchObject({ estado: 'ok', evento: { id: raw.id, programacao: [], convidados: [] } });
    api.mockImplementation(async (endpoint) => endpoint === `v1/event/${raw.id}/` ? { ...raw, enabled: false } as never : { results: [], next: null } as never);
    expect(await getEventoDetalhe(raw.id)).toEqual({ estado: 'nao-encontrado' });
  });

  it.each([false, null, undefined])('consulta individual aceita show_on_site=%s', async (show_on_site) => {
    const base = fixture.results.find((e) => e.active && e.enabled && !e.recurrence_model && !/^GC\b/.test(e.name))!;
    const raw = { ...base, show_on_site };
    api.mockImplementation(async (endpoint) => endpoint === `v1/event/${raw.id}/` ? raw as never : { results: [], next: null } as never);
    admin.mockResolvedValue({ id: raw.id, show_on_site });
    expect(await getEventoDetalhe(raw.id)).toMatchObject({ estado: 'ok', evento: { id: raw.id } });
  });

  it('detalhes reutilizam as unidades da Agenda e o vínculo cacheado, mantendo a consulta individual', async () => {
    getUnidades.mockResolvedValue([{ igrejaId: 30146, nome: 'ADAI Campestre' }, { igrejaId: 31876, nome: 'ADAI Santos' }]);
    const raw = { ...fixture.results.find((e) => e.active && e.enabled && e.show_on_site && !e.recurrence_model && !/^GC\b/.test(e.name))!, responsible_church: null };
    api.mockImplementation(async (endpoint, params = []) => {
      if (endpoint === `v1/event/${raw.id}/`) return { ...raw, description: 'Descrição integral da consulta individual.' } as never;
      const igreja = params.find(([chave]) => chave === 'church_id')?.[1];
      const gc = params.some(([chave]) => chave === 'category_id');
      return { results: gc || (igreja && igreja !== 30146) ? [] : [raw], next: null } as never;
    });
    const resultado = await getEventoDetalhe(raw.id);
    expect(resultado).toMatchObject({ estado: 'ok', evento: { igrejaId: 30146, unidade: 'ADAI Campestre', descricaoCompleta: 'Descrição integral da consulta individual.' } });
    expect(api).toHaveBeenCalledWith(`v1/event/${raw.id}/`);
    for (const id of [30146, 31876]) {
      const consultas = api.mock.calls.filter(([, params = []]) => params.some(([chave, valor]) => chave === 'church_id' && valor === id));
      expect(consultas).toHaveLength(2);
      expect(consultas.filter(([, params = []]) => params.some(([chave]) => chave === 'end_after'))).toHaveLength(1);
      expect(consultas.filter(([, params = []]) => params.some(([chave]) => chave === 'start_after'))).toHaveLength(1);
    }
  });

  it('show_on_site falso não impede resolver Campestre; sem associação não atribui unidade', async () => {
    getUnidades.mockResolvedValue([{ igrejaId: 30146, nome: 'ADAI Campestre' }]);
    const base = fixture.results.find((e) => e.active && e.enabled && e.show_on_site && !e.recurrence_model && !/^GC\b/.test(e.name))!;
    const hackathon = { ...base, id: 1646183, name: 'HACKATHON ADAI HUB', show_on_site: false, responsible_church: null };
    const semUnidade = { ...base, responsible_church: null };
    api.mockImplementation(async (endpoint, params = []) => {
      if (endpoint === `v1/event/${hackathon.id}/`) return hackathon as never;
      if (endpoint === `v1/event/${base.id}/`) return semUnidade as never;
      const gc = params.some(([chave]) => chave === 'category_id');
      const igreja = params.some(([chave]) => chave === 'church_id');
      return { results: gc ? [] : igreja ? [hackathon] : [hackathon, semUnidade], next: null } as never;
    });
    expect(await getEventoDetalhe(hackathon.id)).toMatchObject({ estado: 'ok', evento: { igrejaId: 30146, unidade: 'ADAI Campestre' } });
    expect(admin).toHaveBeenCalledWith(hackathon.id);
    expect(await getEventoDetalhe(base.id)).toMatchObject({ estado: 'ok', evento: { igrejaId: null, unidade: null } });
    expect(hackathon.show_on_site).toBe(false);
  });

  it('detalhe publicado usa administração para unidades e programação, sem expor o objeto cru', async () => {
    const raw = fixture.results.find((e) => e.active && e.enabled && e.show_on_site && !e.recurrence_model && !/^GC\b/.test(e.name))!;
    api.mockImplementation(async (endpoint) => endpoint === `v1/event/${raw.id}/` ? raw as never : { results: [], next: null } as never);
    admin.mockResolvedValue({ ...administrativo, id: raw.id, show_on_site: true, is_enabled: true });
    const resultado = await getEventoDetalhe(raw.id);
    expect(resultado).toMatchObject({ estado: 'ok', evento: { unidade: 'ADAI CAMPESTRE', programacao: [{ data: '2026-10-17' }] } });
    expect(JSON.stringify(resultado)).not.toContain('related_obj');
    admin.mockResolvedValue({ id: raw.id, is_enabled: false });
    expect(await getEventoDetalhe(raw.id)).toEqual({ estado: 'nao-encontrado' });
    admin.mockRejectedValue(new InchurchError('http', 'inchurch_event/:id/', 401));
    expect(await getEventoDetalhe(raw.id)).toMatchObject({ estado: 'ok', evento: { programacao: [] } });
  });

  it('administração indisponível usa dados públicos sem segredo ou programação inventada', async () => {
    const raw = fixture.results.find((e) => e.active && e.enabled && e.show_on_site && !e.recurrence_model && !/^GC\b/.test(e.name))!;
    api.mockImplementation(async (endpoint) => endpoint === `v1/event/${raw.id}/` ? raw as never : { results: [], next: null } as never);
    admin.mockRejectedValue(new Error('ApiKey usuario:segredo-de-teste'));
    expect(await getEventoDetalhe(raw.id)).toMatchObject({ estado: 'ok', evento: { id: raw.id, programacao: [] } });
    expect(JSON.stringify(warn.mock.calls)).not.toContain('segredo-de-teste');
    expect(await getEventoDetalhe(0)).toEqual({ estado: 'nao-encontrado' });
    expect(admin).toHaveBeenCalledTimes(1);
  });

  it('detalhe: ID real, 404 confirmado, erro temporário e último válido', async () => {
    const raw = fixture.results.find((e) => e.active && e.enabled && e.show_on_site && !e.recurrence_model && !/^GC\b/.test(e.name))!;
    let falha: Error | null = null;
    api.mockImplementation(async (endpoint) => {
      if (endpoint === `v1/event/${raw.id}/`) {
        if (falha) throw falha;
        return raw as never;
      }
      return { results: [], next: null } as never;
    });
    expect(await getEventoDetalhe(raw.id)).toMatchObject({ estado: 'ok', evento: { id: raw.id } });
    falha = new InchurchError('timeout', 'v1/event/:id/');
    expect(await getEventoDetalhe(raw.id)).toMatchObject({ estado: 'ok' });
    __limparUltimoValido();
    expect(await getEventoDetalhe(raw.id)).toEqual({ estado: 'indisponivel' });
    falha = new InchurchError('http', 'v1/event/:id/', 404);
    expect(await getEventoDetalhe(raw.id)).toEqual({ estado: 'nao-encontrado' });
    expect(await getEventoDetalhe(-1)).toEqual({ estado: 'nao-encontrado' });
  });

  it('detalhe: categoria GC permanece oculta e indisponibilidade da lista não vira 404', async () => {
    api.mockResolvedValue({ results: [{ id: 55 }], next: null } as never);
    expect(await getEventoDetalhe(55)).toEqual({ estado: 'nao-encontrado' });
    __limparUltimoValido();
    api.mockRejectedValue(new InchurchError('timeout', 'v1/event/'));
    expect(await getEventoDetalhe(55)).toEqual({ estado: 'indisponivel' });
  });

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
