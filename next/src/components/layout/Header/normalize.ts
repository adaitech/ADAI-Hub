import { normalizeBotoes, normalizeLinks, sanitizeHref } from '@/lib/strapi/links';
import type { HeaderData, HeaderView } from './types';

export const HEADER_MAX_LINKS = 6;
export const HEADER_MAX_BOTOES = 2;

/** Sempre retorna um cabeçalho (o logo é fixo); links e botões inválidos são descartados. */
export function normalizeHeader(data: HeaderData | null | undefined, aoVivoUrl?: string | null): HeaderView {
  const destinoAoVivo = sanitizeHref(aoVivoUrl);
  return {
    links: normalizeLinks(data?.links).slice(0, HEADER_MAX_LINKS),
    botoes: normalizeBotoes(data?.botoes)
      .flatMap((botao) => {
        if (botao.href !== '/ao-vivo' && !/ao vivo/i.test(botao.label)) return [botao];
        return destinoAoVivo ? [{ ...botao, href: destinoAoVivo, novaAba: true }] : [];
      })
      .slice(0, HEADER_MAX_BOTOES),
  };
}
