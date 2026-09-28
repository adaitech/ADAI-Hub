import { normalizeLinks } from '@/lib/strapi/links';
import type { FooterColunaView, FooterData, FooterView } from './types';

export const FOOTER_MAX_COLUNAS = 3;
export const FOOTER_MAX_LINKS = 6;

/** Sempre retorna um rodapé (logo e "ADAI" são fixos). Coluna sem título ou sem links é descartada. */
export function normalizeFooter(data: FooterData | null | undefined): FooterView {
  const colunas = (data?.colunas ?? [])
    .map((coluna): FooterColunaView | null => {
      const titulo = coluna.titulo?.trim();
      const links = normalizeLinks(coluna.links).slice(0, FOOTER_MAX_LINKS);
      return titulo && links.length > 0 ? { titulo, links } : null;
    })
    .filter((coluna): coluna is FooterColunaView => coluna !== null)
    .slice(0, FOOTER_MAX_COLUNAS);

  return {
    textoMarca: data?.texto_marca?.trim() || undefined,
    colunas,
    copyright: data?.copyright?.trim() || undefined,
    assinatura: data?.assinatura?.trim() || undefined,
  };
}
