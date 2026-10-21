import { strapiFetch } from '../client';

interface RespostaPaginada<T> {
  data: T[];
  meta: { pagination?: { page: number; pageCount: number } };
}

const POR_PAGINA = 100;
/** Trava contra paginação errada: 2.000 itens é muito acima do que o site terá. */
const MAX_PAGINAS = 20;

/** Todos os itens publicados de uma coleção do Strapi, percorrendo a paginação (100 por página). */
export async function listarPaginado<T>(path: string, query: Record<string, unknown>, tags: string[] = []): Promise<T[]> {
  const itens: T[] = [];
  for (let page = 1; page <= MAX_PAGINAS; page++) {
    const resposta = await strapiFetch<RespostaPaginada<T>>(path, { ...query, pagination: { page, pageSize: POR_PAGINA } }, { tags });
    itens.push(...resposta.data);
    if (page >= (resposta.meta.pagination?.pageCount ?? 1)) break;
  }
  return itens;
}
