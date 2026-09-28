import type { StrapiBotao, StrapiLink } from './types';

export interface LinkView {
  label: string;
  href: string;
  novaAba: boolean;
}

export interface BotaoView extends LinkView {
  estilo: 'solido' | 'contorno';
}

const SAFE_HREF = /^(\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i;

/** Aceita só destinos seguros: caminho interno, âncora, http(s), mailto e tel. Bloqueia `javascript:` e similares. */
export function sanitizeHref(url: string | null | undefined): string | null {
  const href = url?.trim();
  if (!href || !SAFE_HREF.test(href)) return null;
  return href;
}

export function normalizeLink(link: StrapiLink | null | undefined): LinkView | null {
  const label = link?.texto?.trim();
  const href = sanitizeHref(link?.url);
  if (!label || !href) return null;
  return { label, href, novaAba: Boolean(link?.nova_aba) };
}

export function normalizeLinks(links: StrapiLink[] | null | undefined): LinkView[] {
  return (links ?? []).map(normalizeLink).filter((l): l is LinkView => l !== null);
}

export function normalizeBotoes(botoes: StrapiBotao[] | null | undefined): BotaoView[] {
  return (botoes ?? []).flatMap((botao) => {
    const link = normalizeLink(botao);
    if (!link) return [];
    return [{ ...link, estilo: botao.estilo === 'contorno' ? 'contorno' : 'solido' }];
  });
}
