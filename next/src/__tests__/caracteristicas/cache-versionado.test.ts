/**
 * Característica: o `unstable_cache` guarda o resultado **normalizado** das integrações e ele pode
 * sobreviver a um deploy. Se o formato mudar sem mudar a chave do cache, o site serve dados no
 * formato antigo (já aconteceu: o player continuou em youtube.com depois da troca para
 * youtube-nocookie.com, até o cache de 4h expirar).
 *
 * Este teste guarda o formato atual. Se ele falhar porque você mudou o formato de propósito:
 *   1. suba `VERSAO_CACHE_YOUTUBE` (lib/youtube/serie-atual.ts) ou `VERSAO_CACHE_INCHURCH`
 *      (lib/inchurch/eventos-cache.ts);
 *   2. atualize a versão e o formato esperados abaixo.
 */
import fixtureInchurch from '@/lib/inchurch/__fixtures__/eventos.json';
import { normalizeEventos } from '@/lib/inchurch/eventos';
import { VERSAO_CACHE_INCHURCH } from '@/lib/inchurch/eventos-cache';
import type { InchurchEvento } from '@/lib/inchurch/types';
import elePrometeu from '@/lib/youtube/__fixtures__/ele-prometeu.json';
import { normalizeSerie } from '@/lib/youtube/serie';
import { VERSAO_CACHE_YOUTUBE } from '@/lib/youtube/serie-atual';
import type { YoutubePlaylistItem, YoutubeVideo } from '@/lib/youtube/types';
import { formatoDe } from '@/test-utils/formato';

const serie = normalizeSerie({
  playlist: { id: elePrometeu.playlist.id, titulo: elePrometeu.playlist.snippet.title },
  itens: elePrometeu.itens as YoutubePlaylistItem[],
  videos: elePrometeu.videos as YoutubeVideo[],
  agora: new Date('2026-08-31T12:00:00-03:00'),
});
const eventos = normalizeEventos(
  fixtureInchurch.results as InchurchEvento[],
  new Set(fixtureInchurch.idsCategoriaGc),
  new Date('2026-09-28T09:00:00-03:00'),
);

describe('formato guardado em cache × versão da chave', () => {
  it('YouTube (série atual)', () => {
    expect({ versao: VERSAO_CACHE_YOUTUBE, formato: formatoDe(serie) }).toEqual({
      versao: 2,
      formato: [
        'aoVivo',
        'atualizadoEm',
        'conteudos[].culto',
        'conteudos[].domingo',
        'conteudos[].pregador',
        'conteudos[].status',
        'conteudos[].tema',
        'conteudos[].video.embedUrl',
        'conteudos[].video.embeddable',
        'conteudos[].video.thumbnail.height',
        'conteudos[].video.thumbnail.url',
        'conteudos[].video.thumbnail.width',
        'conteudos[].video.videoId',
        'conteudos[].video.youtubeUrl',
        'playlistId',
        'playlistUrl',
        'proximaTransmissao',
        'titulo',
        'tituloFonte',
      ],
    });
  });

  it('inChurch (próximos eventos)', () => {
    expect({ versao: VERSAO_CACHE_INCHURCH, formato: formatoDe(eventos) }).toEqual({
      versao: 1,
      formato: [
        'atualizadoEm',
        'eventos[].descricao',
        'eventos[].destaque',
        'eventos[].id',
        'eventos[].imagem.height',
        'eventos[].imagem.url',
        'eventos[].imagem.width',
        'eventos[].link',
        'eventos[].link.texto',
        'eventos[].link.url',
        'eventos[].nome',
        'eventos[].ocorrencias[].fim',
        'eventos[].ocorrencias[].inicio',
      ],
    });
  });
});

describe('privacidade do conteúdo guardado', () => {
  it('player do YouTube usa o domínio sem cookies (youtube-nocookie.com)', () => {
    for (const { video } of serie.conteudos) {
      if (video) expect(video.embedUrl).toMatch(/^https:\/\/www\.youtube-nocookie\.com\/embed\/[\w-]+$/);
    }
  });
});

describe('formatoDe', () => {
  it('lista caminhos de chaves sem valores; listas viram "[]"', () => {
    expect(formatoDe({ a: 1, b: { c: 'x' }, d: [{ e: 1 }, { e: 2, f: null }], g: [] })).toEqual(['a', 'b.c', 'd[].e', 'd[].f', 'g[]']);
  });
});
