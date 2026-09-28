import { parsePlaylistUrl } from '@/lib/youtube/playlist';
import type { SerieAtualConfig, SerieAtualData } from './types';

/** Configuração do Strapi → configuração da seção. Campos vazios = comportamento automático. */
export function normalizeSerieAtualConfig(data: SerieAtualData): SerieAtualConfig {
  const url = data.playlist_url?.trim() || null;
  const playlistId = parsePlaylistUrl(url);
  return {
    exibir: data.exibir !== false,
    tituloPersonalizado: data.titulo_personalizado?.trim() || null,
    playlistId,
    playlistUrlInvalida: url !== null && playlistId === null,
  };
}
