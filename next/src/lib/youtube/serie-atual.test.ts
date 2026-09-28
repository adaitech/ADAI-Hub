/** @jest-environment node */
import naoCompre from './__fixtures__/nao-compre-essa-briga.json';
import { youtubeFetch } from './client';
import { __limparUltimoValido, getSerieAtual, precisaCacheCurto, urlAoVivoConfirmada } from './serie-atual';
import type { SerieYoutube } from './serie';

// `next/cache` é substituído por chamada direta em jest.setup.ts.
jest.mock('./client', () => ({ ...jest.requireActual('./client'), youtubeFetch: jest.fn() }));

const api = youtubeFetch as jest.MockedFunction<typeof youtubeFetch>;

function youtubeOk() {
  api.mockImplementation(async (endpoint) => {
    if (endpoint === 'playlists') return { items: [naoCompre.playlist] } as never;
    if (endpoint === 'playlistItems') return { items: naoCompre.itens } as never;
    if (endpoint === 'videos') return { items: naoCompre.videos } as never;
    throw new Error(endpoint);
  });
}

describe('getSerieAtual', () => {
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

  it('busca playlist + itens + UMA chamada de videos para todos os IDs', async () => {
    youtubeOk();
    const serie = await getSerieAtual('PLVW0JDZGWu3Q');
    expect(serie?.conteudos).toHaveLength(3);
    const videos = api.mock.calls.filter(([endpoint]) => endpoint === 'videos');
    expect(videos).toHaveLength(1);
    expect(String(videos[0][1].id).split(',')).toHaveLength(3);
  });

  it('cenário 8: YouTube fora com resultado anterior → usa o último válido', async () => {
    youtubeOk();
    const primeiro = await getSerieAtual('PLVW0JDZGWu3Q');
    api.mockRejectedValue(new Error('[youtube] videos: quota 403 (quotaExceeded)'));
    await expect(getSerieAtual('PLVW0JDZGWu3Q')).resolves.toEqual(primeiro);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('último resultado válido'));
  });

  it('YouTube fora sem resultado anterior → null (seção some, página não cai)', async () => {
    api.mockRejectedValue(new Error('[youtube] playlists: timeout'));
    await expect(getSerieAtual('PLVW0JDZGWu3Q')).resolves.toBeNull();
  });

  it('sem YOUTUBE_API_KEY → null, sem lançar e sem logar a chave', async () => {
    api.mockImplementation(jest.requireActual('./client').youtubeFetch);
    const chave = process.env.YOUTUBE_API_KEY;
    delete process.env.YOUTUBE_API_KEY;
    await expect(getSerieAtual(null)).resolves.toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('YOUTUBE_API_KEY ausente'));
    if (chave) process.env.YOUTUBE_API_KEY = chave;
  });
});

describe('precisaCacheCurto (4h × 5 min)', () => {
  const base: SerieYoutube = {
    playlistId: 'P',
    playlistUrl: '',
    titulo: 'S',
    tituloFonte: 'video',
    conteudos: [],
    aoVivo: false,
    proximaTransmissao: null,
    atualizadoEm: '',
  };
  const agora = new Date('2026-09-27T13:00:00Z');

  it('sem live → cache normal de 4h', () => {
    expect(precisaCacheCurto(base, agora)).toBe(false);
  });

  it('live acontecendo → 5 min', () => {
    expect(precisaCacheCurto({ ...base, aoVivo: true }, agora)).toBe(true);
  });

  it('live agendada: 5 min a partir de 15 min antes até 6h depois do horário', () => {
    const agendada = { ...base, proximaTransmissao: '2026-09-27T14:00:00Z' };
    expect(precisaCacheCurto(agendada, new Date('2026-09-27T13:30:00Z'))).toBe(false);
    expect(precisaCacheCurto(agendada, new Date('2026-09-27T13:50:00Z'))).toBe(true);
    expect(precisaCacheCurto(agendada, new Date('2026-09-27T21:00:00Z'))).toBe(false);
  });
});

describe('urlAoVivoConfirmada', () => {
  const agora = new Date('2026-09-27T13:00:00Z');
  const serie: SerieYoutube = {
    playlistId: 'P', playlistUrl: '', titulo: 'S', tituloFonte: 'video',
    aoVivo: true, proximaTransmissao: null, atualizadoEm: '2026-09-27T12:56:00Z',
    conteudos: [{
      domingo: '2026-09-27', status: 'live', culto: true, tema: null, pregador: null,
      video: { videoId: 'abc123def45', youtubeUrl: 'https://www.youtube.com/watch?v=abc123def45', embedUrl: '', thumbnail: null, embeddable: true },
    }],
  };

  it('usa só a live recente', () => {
    expect(urlAoVivoConfirmada(serie, agora)).toBe(serie.conteudos[0].video.youtubeUrl);
    expect(urlAoVivoConfirmada({ ...serie, aoVivo: false }, agora)).toBeNull();
    expect(urlAoVivoConfirmada({ ...serie, atualizadoEm: '2026-09-27T12:49:00Z' }, agora)).toBeNull();
    expect(urlAoVivoConfirmada({ ...serie, conteudos: [] }, agora)).toBeNull();
  });
});
