/**
 * Endereço no site de uma página do Strapi. O slug do Strapi não aceita "/", então páginas
 * em subpasta usam um prefixo: `sobre-nos-nossa-historia` → `/sobre-nos/nossa-historia`
 * (mesmo endereço do site atual, preservando links e SEO).
 */
export const PREFIXO_SOBRE_NOS = 'sobre-nos-';

const SEGMENTO_VALIDO = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function caminhoDaPagina(slug: string): string {
  if (slug === 'home') return '/';
  if (slug.startsWith(PREFIXO_SOBRE_NOS)) return `/sobre-nos/${slug.slice(PREFIXO_SOBRE_NOS.length)}`;
  return `/${slug}`;
}

/** Segmento de `/sobre-nos/<segmento>` → slug do Strapi; fora do padrão de URL → null. */
export function slugDaPaginaSobreNos(segmento: string): string | null {
  return SEGMENTO_VALIDO.test(segmento) ? `${PREFIXO_SOBRE_NOS}${segmento}` : null;
}
