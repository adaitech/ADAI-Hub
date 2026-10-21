import { filtrarCursos } from '@/lib/eba/curso';
import type { CursoResumoView } from '@/lib/eba/types';
import { listarCursosPublicados } from '@/lib/strapi/queries/cursos';
import type { SectionProps } from '@/types/sections';
import { CatalogoCursos } from './CatalogoCursos';
import { normalizeCatalogoCursos } from './normalize';
import type { CatalogoCursosData } from './types';

/**
 * Catálogo de cursos da EBA. Server Component: Strapi = título/vertente/quantidade;
 * tipo Cursos da EBA = os cursos publicados. Falha do Strapi na lista → a seção some (ou, abrindo a página, erro).
 * Abrindo a página (index 0), sem cursos mostra "Novos cursos em breve" em vez de sumir.
 */
export async function CatalogoCursosSection({ data, index }: SectionProps<CatalogoCursosData>) {
  const view = normalizeCatalogoCursos(data);
  if (!view) return null;

  let publicados: CursoResumoView[];
  try {
    publicados = await listarCursosPublicados();
  } catch (erro) {
    // Abrindo a página (/eba/cursos), o catálogo é o conteúdo principal: o erro vai para o error.tsx.
    if (index === 0) throw erro;
    console.warn('[catalogo-cursos] falha ao listar cursos', erro instanceof Error ? erro.message : erro);
    return null;
  }

  return (
    <CatalogoCursos
      id={String(data.id)}
      titulo={view.titulo}
      textoApoio={view.textoApoio}
      cursos={filtrarCursos(publicados, { vertente: view.vertente, quantidade: view.quantidade })}
      verTodos={view.verTodos}
      nivelTitulo={index === 0 ? 1 : 2}
      mostrarVazio={index === 0}
    />
  );
}
