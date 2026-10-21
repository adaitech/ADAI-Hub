import type { PaginaSitemap } from '@/lib/seo/sitemap';
import { listarPaginado } from './paginado';

/** Todas as páginas **publicadas** no Strapi, só com o que o sitemap usa. */
export async function listarPaginasPublicadas(): Promise<PaginaSitemap[]> {
  return listarPaginado<PaginaSitemap>('pages', {
    fields: ['slug', 'updatedAt'],
    populate: { seo: { fields: ['metaRobots', 'canonicalURL'] } },
  });
}
