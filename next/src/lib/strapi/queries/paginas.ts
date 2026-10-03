import type { PaginaSitemap } from '@/lib/seo/sitemap';
import { strapiFetch } from '../client';

interface RespostaPaginada<T> {
  data: T[];
  meta: { pagination?: { page: number; pageCount: number } };
}

const POR_PAGINA = 100;
/** Trava contra paginação errada: 2.000 páginas é muito acima do que o site terá. */
const MAX_PAGINAS = 20;

/** Todas as páginas **publicadas** no Strapi, só com o que o sitemap usa. */
export async function listarPaginasPublicadas(): Promise<PaginaSitemap[]> {
  const paginas: PaginaSitemap[] = [];
  for (let page = 1; page <= MAX_PAGINAS; page++) {
    const resposta = await strapiFetch<RespostaPaginada<PaginaSitemap>>('pages', {
      fields: ['slug', 'updatedAt'],
      populate: { seo: { fields: ['metaRobots', 'canonicalURL'] } },
      pagination: { page, pageSize: POR_PAGINA },
    });
    paginas.push(...resposta.data);
    if (page >= (resposta.meta.pagination?.pageCount ?? 1)) break;
  }
  return paginas;
}
