import type { CatalogoCursosData, CatalogoCursosView } from './types';

const VERTENTES = new Set(['todas', 'integracao', 'consolidacao']);

/** Configuração do catálogo. Sem título → null. Quantidade fora de 1–12 → todos os cursos. */
export function normalizeCatalogoCursos(data: CatalogoCursosData): CatalogoCursosView | null {
  const titulo = data.titulo?.trim();
  if (!titulo) return null;

  const quantidade = data.quantidade;
  const textoApoio = data.texto_apoio?.trim();
  return {
    titulo,
    ...(textoApoio ? { textoApoio } : {}),
    vertente: data.vertente && VERTENTES.has(data.vertente) ? data.vertente : 'todas',
    quantidade: Number.isInteger(quantidade) && quantidade! >= 1 && quantidade! <= 12 ? quantidade! : null,
    verTodos: data.link_ver_todos !== false,
  };
}
