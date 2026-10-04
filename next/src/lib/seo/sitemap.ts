import type { MetadataRoute } from 'next';
import { caminhoDaPagina } from '@/lib/paginas/caminho';

/** Projeção mínima de uma página publicada no Strapi para o sitemap. */
export interface PaginaSitemap {
  slug: string;
  updatedAt?: string | null;
  seo?: { metaRobots?: string | null; canonicalURL?: string | null } | null;
}

/** Páginas que existem no Strapi mas não são para o Google (`/exemplos` = variações de dev). */
export const SLUGS_FORA_DO_SITEMAP = ['exemplos'];

const HOME = 'home';
const SLUG_VALIDO = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function urlDaPagina(slug: string, site: string): string {
  return slug === HOME ? site : `${site}${caminhoDaPagina(slug)}`;
}

/** Canonical do Strapi resolvido no domínio do site, sem barra final (null se vazio/inválido). */
function canonicalResolvido(canonical: string | null | undefined, site: string): string | null {
  const valor = canonical?.trim();
  if (!valor) return null;
  try {
    const url = new URL(valor, site);
    return `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
  } catch {
    return null;
  }
}

/**
 * Entra no sitemap: slug válido, fora da lista de dev, sem `noindex` no "Meta robots" e sem
 * canonical apontando para outra URL (a página diz que a versão oficial está em outro lugar).
 */
export function paginaNoSitemap(pagina: PaginaSitemap, site: string): boolean {
  if (!SLUG_VALIDO.test(pagina.slug) || SLUGS_FORA_DO_SITEMAP.includes(pagina.slug)) return false;
  if (/noindex/i.test(pagina.seo?.metaRobots ?? '')) return false;
  const canonical = canonicalResolvido(pagina.seo?.canonicalURL, site);
  return canonical === null || canonical === urlDaPagina(pagina.slug, site);
}

/** `updatedAt` do Strapi em `AAAA-MM-DD` (UTC), ou undefined se ausente/inválido. */
function dataDe(updatedAt: string | null | undefined): string | undefined {
  const data = updatedAt ? new Date(updatedAt) : null;
  return data && !Number.isNaN(data.getTime()) ? data.toISOString().slice(0, 10) : undefined;
}

/** `/sitemap.xml`: Home primeiro (prioridade 1), depois as páginas em ordem alfabética, sem repetir URL. */
export function montarSitemap(paginas: readonly PaginaSitemap[], site: string): MetadataRoute.Sitemap {
  const porUrl = new Map<string, MetadataRoute.Sitemap[number]>();
  for (const pagina of paginas) {
    if (!paginaNoSitemap(pagina, site)) continue;
    const url = urlDaPagina(pagina.slug, site);
    if (porUrl.has(url)) continue;
    const lastModified = dataDe(pagina.updatedAt);
    porUrl.set(url, { url, ...(lastModified ? { lastModified } : {}), priority: pagina.slug === HOME ? 1 : 0.8 });
  }
  return [...porUrl.values()].sort((a, b) => (a.url === site ? -1 : b.url === site ? 1 : a.url.localeCompare(b.url)));
}
