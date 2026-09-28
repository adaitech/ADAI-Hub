import { youtubeFetch } from './client';
import { parsePlaylistUrl, resolveCurrentSeriesPlaylist } from './playlist';

jest.mock('./client', () => ({
  ...jest.requireActual('./client'),
  youtubeFetch: jest.fn(),
}));

const api = youtubeFetch as jest.MockedFunction<typeof youtubeFetch>;

describe('parsePlaylistUrl', () => {
  it.each([
    ['https://www.youtube.com/playlist?list=PLVW0JDZGWu3Q', 'PLVW0JDZGWu3Q'],
    ['youtube.com/playlist?list=PLYDC2PKIFkH1quzH3MU46Al2aOWmKkVzj', 'PLYDC2PKIFkH1quzH3MU46Al2aOWmKkVzj'],
    ['https://www.youtube.com/watch?v=abc&list=PLVW0JDZGWu3Q&index=2', 'PLVW0JDZGWu3Q'],
    ['https://m.youtube.com/playlist?list=PLVW0JDZGWu3Q', 'PLVW0JDZGWu3Q'],
    ['  PLVW0JDZGWu3Q  ', 'PLVW0JDZGWu3Q'],
  ])('%s → %s', (url, id) => expect(parsePlaylistUrl(url)).toBe(id));

  it.each(['', null, 'https://www.youtube.com/watch?v=abc', 'https://evil.com/playlist?list=PLVW0JDZGWu3Q', 'não é link', 'https://www.youtube.com/playlist?list=<script>'])(
    'inválido: %s',
    (url) => expect(parsePlaylistUrl(url)).toBeNull(),
  );
});

const playlist = (id: string, publishedAt: string, itemCount = 3) => ({ id, snippet: { title: id, publishedAt }, contentDetails: { itemCount } });
const itensEm = (...datas: string[]) => ({ items: datas.map((d, i) => ({ id: `i${i}`, contentDetails: { videoId: `v${i}`, videoPublishedAt: d }, status: { privacyStatus: 'public' } })) });

describe('resolveCurrentSeriesPlaylist', () => {
  const obterChannelId = jest.fn(async () => 'UCadai');
  let warn: jest.SpyInstance;

  beforeEach(() => {
    api.mockReset();
    obterChannelId.mockClear();
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => warn.mockRestore());

  function canal() {
    api.mockImplementation(async (endpoint, params) => {
      if (endpoint === 'playlists') {
        return {
          items: [
            playlist('PLserieAntiga', '2026-08-02T10:00:00Z'),
            playlist('PLconferencia', '2026-09-19T10:00:00Z'), // mais recente, mas é de sábado
            playlist('PLvazia', '2026-09-20T10:00:00Z', 0),
            playlist('PLserieAtual', '2026-09-13T10:00:00Z'),
          ],
        } as never;
      }
      if (endpoint === 'playlistItems') {
        return (params.playlistId === 'PLconferencia' ? itensEm('2026-09-19T23:00:00Z') : itensEm('2026-09-13T16:30:00Z')) as never;
      }
      throw new Error(`inesperado: ${endpoint}`);
    });
  }

  it('cenário 11: sem playlist no CMS → a mais recente que é série de domingo (não assume a primeira)', async () => {
    canal();
    await expect(resolveCurrentSeriesPlaylist(null, { obterChannelId })).resolves.toEqual({
      playlistId: 'PLserieAtual',
      titulo: 'PLserieAtual',
      source: 'youtube-latest',
    });
    expect(obterChannelId).toHaveBeenCalledTimes(1);
  });

  it('cenário 12: playlist válida no CMS → usa a do CMS sem consultar o canal', async () => {
    api.mockResolvedValueOnce({ items: [playlist('PLfixada', '2025-01-01T00:00:00Z')] } as never);
    await expect(resolveCurrentSeriesPlaylist('PLfixada', { obterChannelId })).resolves.toMatchObject({ playlistId: 'PLfixada', source: 'cms' });
    expect(obterChannelId).not.toHaveBeenCalled();
  });

  it('cenário 13: playlist do CMS inválida → aviso no servidor e a mais recente do canal', async () => {
    canal();
    api.mockResolvedValueOnce({ items: [] } as never);
    await expect(resolveCurrentSeriesPlaylist('PLnaoExiste', { obterChannelId })).resolves.toMatchObject({
      playlistId: 'PLserieAtual',
      source: 'youtube-latest',
    });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('PLnaoExiste'));
  });
});
