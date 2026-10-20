/** @jest-environment node */
import { getEventoAdministrativo } from './admin-client';

describe('cliente administrativo', () => {
  const original = { ...process.env };
  const fetchOriginal = global.fetch;
  const credencial = 'ApiKey usuario-teste:segredo-teste';
  let api: jest.Mock;
  beforeEach(() => {
    process.env.INCHURCH_ADMIN_API_KEY = credencial;
    delete process.env.INCHURCH_API_BASE_ADMIN;
    api = jest.fn(); global.fetch = api;
  });
  afterEach(() => { process.env = { ...original }; global.fetch = fetchOriginal; });

  it('GET fixo por ID; credencial completa só no header, timeout e sem redirects', async () => {
    api.mockResolvedValue(new Response(JSON.stringify({ id: 1646183 }), { status: 200 }));
    expect(await getEventoAdministrativo(1646183)).toMatchObject({ id: 1646183 });
    const [url, init] = api.mock.calls[0];
    expect(String(url)).toBe('https://www.inradar.com.br/api/v2/inchurch_event/1646183/?auth=event');
    expect(init).toMatchObject({ headers: { Authorization: credencial, 'User-Agent': 'ADAI-Hub/1.0', Channel: 'control_panel' }, cache: 'no-store', redirect: 'error' });
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(String(url)).not.toContain('segredo-teste');
  });
  it('preserva a publicação em duas igrejas e descarta campos privados também nas relações', async () => {
    api.mockResolvedValue(new Response(JSON.stringify({ id: 1646183, owner: 'privado', units: [
      { id: 34726, name: 'ADAI CAMPESTRE', private_field: 'privado', related_obj: { id: 30146, model: 'inradartertiarygroup', name: 'ADAI CAMPESTRE', owner: 'privado' } },
      { id: 34728, name: 'ADAI SANTOS', related_obj: { id: 31876, model: 'inradartertiarygroup', name: 'ADAI SANTOS' } },
    ], event_attractions: [{ name: 'Diogo Mour', email: 'privado' }], event_images: [{ id: 115202, image: 'https://example.com/foto.jpg', internal_token: 'privado', on_blacklist: false }], location: { city: { name: 'Santos', owner: 'privado' }, internal_token: 'privado' } }), { status: 200 }));
    const view = await getEventoAdministrativo(1646183);
    expect(view.units?.map((u) => u.related_obj?.id)).toEqual([30146, 31876]);
    expect(view.event_images).toEqual([expect.objectContaining({ id: 115202, image: 'https://example.com/foto.jpg' })]);
    expect(JSON.stringify(view)).not.toContain('privado');
  });
  it.each([0, -1, 1.5, NaN, Number.MAX_SAFE_INTEGER + 1])('ID inválido %s não consulta a API', async (id) => {
    await expect(getEventoAdministrativo(id)).rejects.toMatchObject({ kind: 'resposta' });
    expect(api).not.toHaveBeenCalled();
  });
  it.each([undefined, '', 'usuario:segredo', 'ApiKey usuario:segredo\r\nX-Test: valor'])('configuração inválida não consulta nem expõe credencial', async (valor) => {
    if (valor === undefined) delete process.env.INCHURCH_ADMIN_API_KEY;
    else process.env.INCHURCH_ADMIN_API_KEY = valor;
    await expect(getEventoAdministrativo(1)).rejects.toMatchObject({ kind: 'config' });
    expect(api).not.toHaveBeenCalled();
  });
  it.each([401, 403, 404, 429, 503])('HTTP %s não inclui corpo interno no erro', async (status) => {
    api.mockResolvedValue(new Response(JSON.stringify({ detail: credencial }), { status }));
    const error = await getEventoAdministrativo(1).catch((e: unknown) => e as Error);
    expect(error).toMatchObject({ status });
    expect(String(error)).not.toContain(credencial);
  });
  it('base configurável usa HTTPS sem credenciais ou parâmetros na URL', async () => {
    process.env.INCHURCH_API_BASE_ADMIN = 'https://admin.example/api/v2/';
    api.mockResolvedValue(new Response('{"id":1}', { status: 200 }));
    await getEventoAdministrativo(1);
    expect(String(api.mock.calls[0][0])).toBe('https://admin.example/api/v2/inchurch_event/1/?auth=event');
    process.env.INCHURCH_API_BASE_ADMIN = 'http://admin.example/api/v2';
    await expect(getEventoAdministrativo(1)).rejects.toMatchObject({ kind: 'config' });
    expect(api).toHaveBeenCalledTimes(1);
  });
  it('rede, timeout, JSON inválido e ID divergente geram erros sanitizados', async () => {
    api.mockRejectedValueOnce(new Error(credencial));
    await expect(getEventoAdministrativo(1)).rejects.toMatchObject({ kind: 'rede' });
    api.mockRejectedValueOnce(Object.assign(new Error(credencial), { name: 'TimeoutError' }));
    await expect(getEventoAdministrativo(1)).rejects.toMatchObject({ kind: 'timeout' });
    for (const corpo of ['<html>', '[]', '{"id":2}']) {
      api.mockResolvedValueOnce(new Response(corpo, { status: 200 }));
      await expect(getEventoAdministrativo(1)).rejects.toMatchObject({ kind: 'resposta' });
    }
  });
});
