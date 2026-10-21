import type { TrilhaItem } from '@/components/ui/Trilha';
import type { CursoResumoView, CursoView } from './types';

const CONTEXTO = 'https://schema.org';

/** `Course` (schema.org) da página do curso, sem prometer resultado enriquecido no Google. */
export function schemaDoCurso(curso: CursoView, site: string) {
  return {
    '@context': CONTEXTO,
    '@type': 'Course',
    name: curso.nome,
    description: curso.resumo,
    url: `${site}${curso.href}`,
    provider: { '@type': 'Organization', name: 'ADAI', sameAs: site },
  };
}

/** `ItemList` do catálogo, na ordem em que os cursos aparecem. */
export function schemaDoCatalogo(cursos: CursoResumoView[], site: string) {
  return {
    '@context': CONTEXTO,
    '@type': 'ItemList',
    itemListElement: cursos.map((curso, i) => ({ '@type': 'ListItem', position: i + 1, url: `${site}${curso.href}`, name: curso.nome })),
  };
}

/** `BreadcrumbList` da trilha; o último item (página atual) vai sem URL. */
export function schemaDaTrilha(itens: TrilhaItem[], site: string) {
  return {
    '@context': CONTEXTO,
    '@type': 'BreadcrumbList',
    itemListElement: itens.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.texto,
      ...(item.href ? { item: `${site}${item.href}` } : {}),
    })),
  };
}
