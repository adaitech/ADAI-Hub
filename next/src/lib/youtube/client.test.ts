/** @jest-environment node */
import { youtubeFetch, YoutubeError } from './client';

const CHAVE = 'chave-de-teste-nao-real';

describe('youtubeFetch', () => {
  const fetchOriginal = global.fetch;
  const envOriginal = { ...process.env };
  let fetchMock: jest.Mock;

  beforeEach(() => {
    process.env.YOUTUBE_API_KEY = CHAVE;
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });
  afterEach(() => {
    global.fetch = fetchOriginal;
    process.env = { ...envOriginal };
  });

  it('manda a chave só no header, nunca na URL', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ items: [] }), { status: 200 }));
    await youtubeFetch('playlists', { part: 'snippet', id: 'PL1' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=PL1');
    expect(String(url)).not.toContain(CHAVE);
    expect(init.headers['X-Goog-Api-Key']).toBe(CHAVE);
    expect(init.cache).toBe('no-store');
  });

  it.each([
    [403, 'quotaExceeded', 'quota'],
    [429, 'rateLimitExceeded', 'quota'],
    [403, 'forbidden', 'http'],
    [500, undefined, 'http'],
  ])('erro %s (%s) vira YoutubeError "%s" sem vazar a chave', async (status, reason, kind) => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: { errors: [{ reason }] } }), { status }));
    const erro = await youtubeFetch('videos', { id: 'x' }).catch((e: unknown) => e);
    expect(erro).toBeInstanceOf(YoutubeError);
    expect(erro).toMatchObject({ kind, status });
    expect(String((erro as Error).message)).not.toContain(CHAVE);
  });

  it('timeout e rede viram YoutubeError', async () => {
    fetchMock.mockRejectedValueOnce(Object.assign(new Error('x'), { name: 'TimeoutError' }));
    await expect(youtubeFetch('videos', {})).rejects.toMatchObject({ kind: 'timeout' });
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));
    await expect(youtubeFetch('videos', {})).rejects.toMatchObject({ kind: 'rede' });
  });

  it('resposta que não é JSON vira YoutubeError "resposta"', async () => {
    fetchMock.mockResolvedValue(new Response('<html>', { status: 200 }));
    await expect(youtubeFetch('videos', {})).rejects.toMatchObject({ kind: 'resposta' });
  });

  it('sem YOUTUBE_API_KEY não chama o Google', async () => {
    delete process.env.YOUTUBE_API_KEY;
    await expect(youtubeFetch('videos', {})).rejects.toMatchObject({ kind: 'config' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
