/** @jest-environment node */
import { inchurchFetch, InchurchError } from './client';

const KEY = 'chave-teste';
const SECRET = 'segredo-teste';

describe('inchurchFetch', () => {
  const fetchOriginal = global.fetch;
  const envOriginal = { ...process.env };
  let fetchMock: jest.Mock;

  beforeEach(() => {
    Object.assign(process.env, { INCHURCH_API_KEY: KEY, INCHURCH_API_SECRET: SECRET, INCHURCH_API_BASE_PUBLIC: 'https://api.inchurch.com.br/public' });
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });
  afterEach(() => {
    global.fetch = fetchOriginal;
    process.env = { ...envOriginal };
  });

  it('Basic base64(key:secret) só no header; parâmetros repetidos preservados', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ results: [] }), { status: 200 }));
    await inchurchFetch('v1/event/', [['category_id', 1], ['category_id', 2], ['limit', 100]]);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('https://api.inchurch.com.br/public/v1/event/?category_id=1&category_id=2&limit=100');
    expect(String(url)).not.toContain(KEY);
    expect(String(url)).not.toContain(SECRET);
    expect(init.headers.Authorization).toBe(`Basic ${Buffer.from(`${KEY}:${SECRET}`).toString('base64')}`);
    expect(init.cache).toBe('no-store');
  });

  it.each([
    [401, 'UNAUTHORIZED', 'http'],
    [403, 'FORBIDDEN', 'http'],
    [429, 'RATE_LIMITED', 'limite'],
    [500, 'INTERNAL_ERROR', 'http'],
  ])('HTTP %s vira InchurchError "%s/%s" sem vazar credenciais', async (status, code, kind) => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: { code } }), { status }));
    const erro = await inchurchFetch('v1/event/').catch((e: unknown) => e);
    expect(erro).toBeInstanceOf(InchurchError);
    expect(erro).toMatchObject({ kind, status, code });
    expect((erro as Error).message).not.toMatch(new RegExp(`${KEY}|${SECRET}`));
  });

  it('timeout, rede e JSON inválido', async () => {
    fetchMock.mockRejectedValueOnce(Object.assign(new Error('x'), { name: 'TimeoutError' }));
    await expect(inchurchFetch('v1/event/')).rejects.toMatchObject({ kind: 'timeout' });
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));
    await expect(inchurchFetch('v1/event/')).rejects.toMatchObject({ kind: 'rede' });
    fetchMock.mockResolvedValueOnce(new Response('<html>', { status: 200 }));
    await expect(inchurchFetch('v1/event/')).rejects.toMatchObject({ kind: 'resposta' });
  });

  it('sem credenciais não chama a API', async () => {
    delete process.env.INCHURCH_API_SECRET;
    await expect(inchurchFetch('v1/event/')).rejects.toMatchObject({ kind: 'config' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
