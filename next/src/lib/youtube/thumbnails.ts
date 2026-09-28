import type { YoutubeThumbnail, YoutubeThumbnails } from './types';

const PRIORIDADE = ['maxres', 'standard', 'high', 'medium', 'default'] as const;

/** Melhor thumbnail disponível: maxres → standard → high → medium → default. Nunca assume que maxres existe. */
export function getBestYoutubeThumbnail(thumbnails: YoutubeThumbnails | undefined | null): YoutubeThumbnail | null {
  for (const tamanho of PRIORIDADE) {
    const thumb = thumbnails?.[tamanho];
    if (thumb?.url) return { url: thumb.url, width: thumb.width, height: thumb.height };
  }
  return null;
}
