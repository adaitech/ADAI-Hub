import { STRAPI_URL } from './client';
import type { StrapiMedia } from './types';

export interface MediaView {
  url: string;
  alt: string;
  width: number;
  height: number;
}

/** URL relativa do Strapi (`/uploads/...`) vira absoluta; caminhos do próprio site (`/mocks/...`) ficam como estão. */
export function resolveStrapiUrl(url: string): string {
  if (/^https?:\/\//.test(url)) return url;
  if (url.startsWith('/uploads/')) return `${STRAPI_URL}${url}`;
  return url;
}

/** Normaliza uma mídia do Strapi. Sem URL → null. Sem texto alternativo → alt vazio (decorativa). */
export function resolveStrapiMedia(media: StrapiMedia | null | undefined): MediaView | null {
  const url = media?.url?.trim();
  if (!media || !url) return null;

  return {
    url: resolveStrapiUrl(url),
    alt: media.alternativeText?.trim() ?? '',
    width: media.width ?? 0,
    height: media.height ?? 0,
  };
}
