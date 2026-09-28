import { normalizeBotoes, normalizeLinks } from '@/lib/strapi/links';
import type { HeaderData, HeaderView } from './types';

export const HEADER_MAX_LINKS = 6;
export const HEADER_MAX_BOTOES = 2;

/** Sempre retorna um cabeçalho (o logo é fixo); links e botões inválidos são descartados. */
export function normalizeHeader(data: HeaderData | null | undefined): HeaderView {
  return {
    links: normalizeLinks(data?.links).slice(0, HEADER_MAX_LINKS),
    botoes: normalizeBotoes(data?.botoes).slice(0, HEADER_MAX_BOTOES),
  };
}
