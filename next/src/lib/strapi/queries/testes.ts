import { draftMode } from 'next/headers';
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

/** Teste pelo slug (textos da abertura da tela do teste; em draft mode, o rascunho). Inexistente ou inválido → null; erro do Strapi → lança. */
export async function getTesteBySlug(slug: string): Promise<TesteView | null> {
  const { isEnabled: draft } = await draftMode();
  const resposta = await strapiFetch<StrapiCollectionResponse<StrapiTeste>>(
    'testes',
    { filters: { slug: { $eq: slug } }, pagination: { pageSize: 1 } },
    { tags: [TAG_TESTES, `teste:${slug}`], draft },
  );
  const teste = resposta.data[0];
  return teste ? normalizeTeste(teste) : null;
}
