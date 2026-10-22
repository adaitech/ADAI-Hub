import { curso, normalizeAula, ordenarAulas, type AulaView, type CursoDeAulas } from '@/lib/eba/aula';
import type { StrapiAula } from '@/lib/eba/types';
import { strapiFetch } from '../client';
import type { StrapiCollectionResponse } from '../types';

const TAG_AULAS = 'aulas';
/** Um curso tem poucas dezenas de aulas (DNA 17, Reset 8): cabem numa página. */
const POR_PAGINA = 100;

/**
 * Aulas publicadas de um curso, na ordem do Strapi. O tipo `aula` é **privado**: a leitura vai com o
 * `STRAPI_TOKEN_AULAS` (só servidor, token do Strapi só com `aula.find`; sem ele, cai no `STRAPI_API_TOKEN`), então o
 * endereço dos vídeos não sai pela API aberta do Strapi e o token estreito não vai nas outras chamadas.
 * Curso desconhecido → `[]`; Strapi recusando (sem token) ou fora → lança `StrapiError`.
 */
export async function listarAulasDoCurso(slugDoCurso: CursoDeAulas): Promise<AulaView[]> {
  if (!curso(slugDoCurso)) return [];
  const resposta = await strapiFetch<StrapiCollectionResponse<StrapiAula>>(
    'aulas',
    { filters: { curso: { $eq: slugDoCurso } }, populate: { foto_autor: true }, pagination: { pageSize: POR_PAGINA } },
    { tags: [TAG_AULAS, `aulas:${slugDoCurso}`], token: process.env.STRAPI_TOKEN_AULAS },
  );
  const aulas = resposta.data.map(normalizeAula).filter((a): a is AulaView => a !== null && a.curso === slugDoCurso);
  return ordenarAulas(aulas);
}
