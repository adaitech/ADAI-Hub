import { unstable_cache } from 'next/cache';
import { getChannelHandle, youtubeFetch, YOUTUBE_CACHE_TAG } from './client';
import { buscarChannelId, resolveCurrentSeriesPlaylist } from './playlist';
import { normalizeSerie, type SerieYoutube } from './serie';
import type { YoutubeListResponse, YoutubePlaylistItem, YoutubeVideo } from './types';

/** Cache normal do YouTube: 4 horas. */
export const TTL_NORMAL_S = 14_400;
/** Durante transmissão ao vivo: 5 minutos (percebe início, fim e publicação do corte). */
export const TTL_AO_VIVO_S = 300;
/** channelId praticamente não muda. */
const TTL_CANAL_S = 604_800;
/** Uma live agendada entra no cache curto 15 min antes do horário. */
const ANTECEDENCIA_LIVE_MS = 15 * 60_000;
/** ...e fica nele por até 6h depois do horário agendado (atraso ou culto longo). */
const JANELA_LIVE_MS = 6 * 3_600_000;

async function carregarSerie(playlistId: string, playlistTitulo: string | null): Promise<SerieYoutube> {
  const itens = await youtubeFetch<YoutubeListResponse<YoutubePlaylistItem>>('playlistItems', {
    part: 'snippet,contentDetails,status',
    playlistId,
    maxResults: 50,
  });
  const ids = [...new Set((itens.items ?? []).map((i) => i.contentDetails?.videoId).filter((id): id is string => Boolean(id)))];
  // Uma chamada só para todos os vídeos (até 50 IDs), nunca uma por vídeo.
  const videos = ids.length
    ? await youtubeFetch<YoutubeListResponse<YoutubeVideo>>('videos', {
        part: 'snippet,status,liveStreamingDetails',
        id: ids.join(','),
        maxResults: 50,
      })
    : { items: [] };

  const serie = normalizeSerie({ playlist: { id: playlistId, titulo: playlistTitulo }, itens: itens.items ?? [], videos: videos.items ?? [] });
  // Só roda em cache miss (no máximo 1x por TTL): registra como a decisão foi tomada.
  console.info(
    `[youtube] Série atualizada: playlist=${playlistId} titulo=${serie.tituloFonte} partes=${serie.conteudos.length} aoVivo=${serie.aoVivo}`,
  );
  return serie;
}

const channelIdCache = unstable_cache(buscarChannelId, ['youtube', 'channel-id'], {
  revalidate: TTL_CANAL_S,
  tags: [YOUTUBE_CACHE_TAG],
});

const playlistCache = unstable_cache(
  async (cmsPlaylistId: string | null) => {
    const resolvida = await resolveCurrentSeriesPlaylist(cmsPlaylistId, { obterChannelId: () => channelIdCache(getChannelHandle()) });
    console.info(`[youtube] Playlist da série: ${resolvida.playlistId} (source=${resolvida.source})`);
    return resolvida;
  },
  ['youtube', 'playlist-atual'],
  { revalidate: TTL_NORMAL_S, tags: [YOUTUBE_CACHE_TAG] },
);

const serieNormalCache = unstable_cache(carregarSerie, ['youtube', 'serie', 'normal'], {
  revalidate: TTL_NORMAL_S,
  tags: [YOUTUBE_CACHE_TAG],
});

const serieAoVivoCache = unstable_cache(carregarSerie, ['youtube', 'serie', 'ao-vivo'], {
  revalidate: TTL_AO_VIVO_S,
  tags: [YOUTUBE_CACHE_TAG],
});

/** Usa o cache de 5 minutos? Só com live acontecendo ou prestes a começar. */
export function precisaCacheCurto(serie: SerieYoutube, agora: Date): boolean {
  if (serie.aoVivo) return true;
  if (!serie.proximaTransmissao) return false;
  const inicio = new Date(serie.proximaTransmissao).getTime();
  const t = agora.getTime();
  return t >= inicio - ANTECEDENCIA_LIVE_MS && t <= inicio + JANELA_LIVE_MS;
}

/**
 * Último resultado bom por configuração, em memória do processo (ideia do `cmsLastGood` do
 * vitru-portal). Cobre o caso em que o Data Cache não tem nada utilizável e o YouTube falha.
 */
const ultimoValido = new Map<string, SerieYoutube>();

/** Apenas para testes. */
export function __limparUltimoValido(): void {
  ultimoValido.clear();
}

/**
 * Série atual pronta para a seção. Nunca lança: sem YouTube e sem resultado anterior → `null`
 * (a seção some e a página continua de pé).
 *
 * Cache (Next Data Cache via `unstable_cache`, tag `youtube`):
 * - playlist resolvida: 4h, por configuração do CMS (`playlist_url` entra na chave);
 * - série: 4h; com live no ar (ou prestes a começar), 5 min;
 * - entrada vencida + YouTube fora → o Next devolve a versão anterior (stale-if-error);
 *   sem nenhuma entrada → `ultimoValido`.
 */
export async function getSerieAtual(cmsPlaylistId: string | null, agora: Date = new Date()): Promise<SerieYoutube | null> {
  const chave = cmsPlaylistId ?? 'auto';
  try {
    const playlist = await playlistCache(cmsPlaylistId);
    let serie = await serieNormalCache(playlist.playlistId, playlist.titulo);
    if (precisaCacheCurto(serie, agora)) {
      serie = await serieAoVivoCache(playlist.playlistId, playlist.titulo).catch((error: unknown) => {
        console.warn(`[youtube] Cache de live indisponível (${mensagem(error)}): usando o de 4h.`);
        return serie;
      });
    }
    ultimoValido.set(chave, serie);
    return serie;
  } catch (error) {
    const anterior = ultimoValido.get(chave) ?? null;
    console.warn(
      `[youtube] Série atual indisponível (${mensagem(error)}): ${anterior ? 'usando o último resultado válido' : 'seção oculta'}.`,
    );
    return anterior;
  }
}

/** Mensagem segura para log: nunca inclui URL, headers ou a chave. */
function mensagem(error: unknown): string {
  return error instanceof Error ? error.message : 'erro desconhecido';
}
