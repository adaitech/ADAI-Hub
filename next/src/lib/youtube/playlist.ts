import { getChannelHandle, youtubeFetch, YoutubeError } from './client';
import { ehDomingoDeCulto, lerData } from './domingos';
import type { YoutubeChannel, YoutubeListResponse, YoutubePlaylist, YoutubePlaylistItem } from './types';

const ID_PLAYLIST = /^[A-Za-z0-9_-]{10,64}$/;
const HOSTS_YOUTUBE = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be']);

/** Quantas playlists recentes testar até achar uma série válida (cada teste custa 1 unidade de quota). */
const MAX_CANDIDATAS = 5;

/**
 * URL de playlist colada no Strapi → playlistId. Aceita também o ID puro.
 * `https://www.youtube.com/playlist?list=PLxxxx` → `PLxxxx`. Qualquer outra coisa → `null`.
 */
export function parsePlaylistUrl(valor: string | null | undefined): string | null {
  const texto = valor?.trim();
  if (!texto) return null;
  if (ID_PLAYLIST.test(texto) && !texto.includes('.')) return texto;
  try {
    const url = new URL(/^https?:\/\//i.test(texto) ? texto : `https://${texto}`);
    if (!HOSTS_YOUTUBE.has(url.hostname.toLowerCase())) return null;
    const lista = url.searchParams.get('list');
    return lista && ID_PLAYLIST.test(lista) ? lista : null;
  } catch {
    return null;
  }
}

export interface PlaylistResolvida {
  playlistId: string;
  titulo: string | null;
  /** Metadado de servidor (logs): de onde veio a playlist. Não vai para o navegador. */
  source: 'cms' | 'youtube-latest';
}

/** channelId pelo handle (`channels.list?forHandle=`). Cacheado por 7 dias em `serie-atual.ts`. */
export async function buscarChannelId(handle: string): Promise<string> {
  const resposta = await youtubeFetch<YoutubeListResponse<YoutubeChannel>>('channels', { part: 'id,snippet', forHandle: handle });
  const id = resposta.items?.[0]?.id;
  if (!id) throw new YoutubeError('resposta', 'channels', undefined, 'canal não encontrado');
  return id;
}

async function playlistPorId(playlistId: string): Promise<YoutubePlaylist | null> {
  const resposta = await youtubeFetch<YoutubeListResponse<YoutubePlaylist>>('playlists', {
    part: 'snippet,contentDetails',
    id: playlistId,
    maxResults: 1,
  });
  const playlist = resposta.items?.[0];
  return playlist && (playlist.contentDetails?.itemCount ?? 0) > 0 ? playlist : null;
}

/** Série de domingo: tem ao menos um vídeo público de culto de domingo (descarta conferências e cultos de sábado). */
async function ehSerieDeDomingo(playlistId: string): Promise<boolean> {
  const resposta = await youtubeFetch<YoutubeListResponse<YoutubePlaylistItem>>('playlistItems', {
    part: 'contentDetails,status',
    playlistId,
    maxResults: 50,
  });
  return (resposta.items ?? []).some((item) => {
    if (item.status?.privacyStatus === 'private') return false;
    const data = lerData(item.contentDetails?.videoPublishedAt);
    return data !== null && ehDomingoDeCulto(data);
  });
}

interface ResolverOpcoes {
  /** channelId cacheado (evita `channels.list` a cada atualização). */
  obterChannelId?: () => Promise<string>;
}

/**
 * Qual playlist é a série atual.
 * 1. `playlist_url` do Strapi, se existir e for válida no YouTube;
 * 2. senão, a playlist pública mais recente (por `snippet.publishedAt`) que seja série de domingo.
 * Playlist do CMS inválida → aviso no servidor e segue para a automática. O nome da playlist
 * nunca é usado para identificar a série.
 */
export async function resolveCurrentSeriesPlaylist(
  cmsPlaylistId: string | null,
  { obterChannelId = () => buscarChannelId(getChannelHandle()) }: ResolverOpcoes = {},
): Promise<PlaylistResolvida> {
  if (cmsPlaylistId) {
    const playlist = await playlistPorId(cmsPlaylistId);
    if (playlist) return { playlistId: playlist.id, titulo: playlist.snippet?.title ?? null, source: 'cms' };
    console.warn(`[youtube] Playlist do Strapi "${cmsPlaylistId}" não encontrada ou vazia: usando a mais recente do canal.`);
  }

  const channelId = await obterChannelId();
  const resposta = await youtubeFetch<YoutubeListResponse<YoutubePlaylist>>('playlists', {
    part: 'snippet,contentDetails',
    channelId,
    maxResults: 50,
  });
  const candidatas = (resposta.items ?? [])
    .filter((p) => (p.contentDetails?.itemCount ?? 0) > 0 && p.snippet?.publishedAt)
    .sort((a, b) => (b.snippet?.publishedAt ?? '').localeCompare(a.snippet?.publishedAt ?? ''));
  if (candidatas.length === 0) throw new YoutubeError('resposta', 'playlists', undefined, 'canal sem playlists');

  for (const playlist of candidatas.slice(0, MAX_CANDIDATAS)) {
    if (await ehSerieDeDomingo(playlist.id)) {
      return { playlistId: playlist.id, titulo: playlist.snippet?.title ?? null, source: 'youtube-latest' };
    }
  }
  const [maisRecente] = candidatas;
  console.warn(`[youtube] Nenhuma das ${MAX_CANDIDATAS} playlists mais recentes tem culto de domingo: usando "${maisRecente.id}".`);
  return { playlistId: maisRecente.id, titulo: maisRecente.snippet?.title ?? null, source: 'youtube-latest' };
}
