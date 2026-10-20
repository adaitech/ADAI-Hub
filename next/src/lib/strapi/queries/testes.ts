import { normalizeTeste, ordenarTestes } from '@/lib/eba/teste';
import type { StrapiTeste, TesteView } from '@/lib/eba/types';
import { strapiFetch } from '../client';
import type { StrapiCollectionResponse } from '../types';

const TAG_TESTES = 'testes';
/** Os testes do CDV cabem numa página. */
const POR_PAGINA = 100;

/** Testes publicados, prontos para a Lista de testes, na ordem do Strapi (ordem, depois nome). Erro do Strapi → lança. */
export async function listarTestesPublicados(): Promise<TesteView[]> {
  const resposta = await strapiFetch<StrapiCollectionResponse<StrapiTeste>>(
    'testes',
    { pagination: { pageSize: POR_PAGINA } },
    { tags: [TAG_TESTES] },
  );
  return ordenarTestes(resposta.data.map(normalizeTeste).filter((t): t is TesteView => t !== null));
}
