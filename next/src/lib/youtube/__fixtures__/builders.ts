import type { YoutubePlaylistItem, YoutubeThumbnails, YoutubeVideo } from '../types';

/** Monta pares item de playlist + vídeo para os testes (formato da YouTube Data API). */
interface VideoFake {
  id: string;
  titulo: string;
  /** Início real da transmissão (ISO). */
  inicio?: string;
  /** Fim real da transmissão (ISO). */
  fim?: string;
  /** `videoPublishedAt` (ISO). */
  publicado?: string;
  agendado?: string;
  estado?: 'live' | 'upcoming' | 'none';
  embeddable?: boolean;
  privacidade?: 'public' | 'private' | 'unlisted';
  thumbnails?: YoutubeThumbnails;
}

export function fake(v: VideoFake): { item: YoutubePlaylistItem; video: YoutubeVideo } {
  const thumbnails = v.thumbnails ?? { high: { url: `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`, width: 480, height: 360 } };
  return {
    item: {
      id: `item-${v.id}`,
      snippet: { title: v.titulo, thumbnails },
      contentDetails: { videoId: v.id, videoPublishedAt: v.publicado ?? v.fim ?? v.inicio },
      status: { privacyStatus: v.privacidade ?? 'public' },
    },
    video: {
      id: v.id,
      snippet: { title: v.titulo, liveBroadcastContent: v.estado ?? 'none', thumbnails, publishedAt: v.publicado ?? v.inicio },
      status: { privacyStatus: v.privacidade ?? 'public', embeddable: v.embeddable ?? true },
      liveStreamingDetails:
        v.inicio || v.agendado ? { actualStartTime: v.inicio, actualEndTime: v.fim, scheduledStartTime: v.agendado } : undefined,
    },
  };
}

export function separar(pares: ReturnType<typeof fake>[]) {
  return { itens: pares.map((p) => p.item), videos: pares.map((p) => p.video) };
}

/** Mensagem publicada num domingo de manhã (culto 11h, corte às 13h30 de Brasília). */
export function mensagem(id: string, domingo: string, titulo: string, extra: Partial<VideoFake> = {}) {
  return fake({ id, titulo, inicio: `${domingo}T14:00:00Z`, fim: `${domingo}T16:00:00Z`, publicado: `${domingo}T16:30:00Z`, ...extra });
}
