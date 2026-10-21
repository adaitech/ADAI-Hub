import { draftMode } from 'next/headers';
import { filtrarCursos, normalizeCurso, normalizeCursoResumo } from '@/lib/eba/curso';
import type { CursoResumoView, CursoView, StrapiCurso } from '@/lib/eba/types';
import { sectionsPopulate } from '@/lib/registry/sectionRegistry';
import type { PaginaSitemap } from '@/lib/seo/sitemap';
import { strapiFetch } from '../client';
import type { StrapiCollectionResponse } from '../types';
import { listarPaginado } from './paginado';

/** Seções que o editor pode usar no corpo de um curso (dynamic zone `secoes`). */
export const SECOES_DO_CURSO = ['sections.imagem-texto', 'sections.texto-rico', 'sections.perguntas-frequentes', 'sections.texto-botoes'];

const TAG_CURSOS = 'cursos';
/** Um catálogo de cursos cabe numa página. */
const POR_PAGINA = 100;

function populateDasSecoes() {
  const todas = sectionsPopulate();
  return Object.fromEntries(SECOES_DO_CURSO.filter((s) => s in todas).map((s) => [s, todas[s]]));
}

/** Cursos publicados, prontos para o catálogo, na ordem do Strapi (ordem, depois nome). */
export async function listarCursosPublicados(): Promise<CursoResumoView[]> {
  const resposta = await strapiFetch<StrapiCollectionResponse<StrapiCurso>>(
    'cursos',
    { populate: { capa: true, inscricao: true }, pagination: { pageSize: POR_PAGINA } },
    { tags: [TAG_CURSOS] },
  );
  const cursos = resposta.data.map(normalizeCursoResumo).filter((c): c is CursoResumoView => c !== null);
  return filtrarCursos(cursos);
}

/** Curso pelo slug (em draft mode traz o rascunho). Inexistente → null; erro do Strapi → lança. */
export async function getCursoBySlug(slug: string): Promise<CursoView | null> {
  const { isEnabled: draft } = await draftMode();
  const resposta = await strapiFetch<StrapiCollectionResponse<StrapiCurso>>(
    'cursos',
    {
      filters: { slug: { $eq: slug } },
      populate: {
        capa: true,
        inscricao: true,
        seo: { populate: { metaImage: true } },
        secoes: { on: populateDasSecoes() },
      },
      pagination: { pageSize: 1 },
    },
    { tags: [TAG_CURSOS, `curso:${slug}`], draft },
  );
  const curso = resposta.data[0];
  return curso ? normalizeCurso(curso) : null;
}

/** Cursos publicados, só com o que o sitemap usa. */
export async function listarCursosParaSitemap(): Promise<PaginaSitemap[]> {
  return listarPaginado<PaginaSitemap>(
    'cursos',
    { fields: ['slug', 'updatedAt'], populate: { seo: { fields: ['metaRobots', 'canonicalURL'] } } },
    [TAG_CURSOS],
  );
}
