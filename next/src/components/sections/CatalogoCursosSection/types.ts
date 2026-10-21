import type { CursoResumoView, Vertente } from '@/lib/eba/types';

/** JSON cru de `sections.catalogo-cursos`: só a configuração. Os cursos vêm do tipo Cursos da EBA. */
export interface CatalogoCursosData {
  __component: 'sections.catalogo-cursos';
  id: number;
  titulo?: string | null;
  texto_apoio?: string | null;
  vertente?: 'todas' | Vertente | null;
  /** 1 a 12; vazio = todos. */
  quantidade?: number | null;
  link_ver_todos?: boolean | null;
}

export interface CatalogoCursosView {
  titulo: string;
  textoApoio?: string;
  vertente: 'todas' | Vertente;
  quantidade: number | null;
  verTodos: boolean;
}

/** Exemplo da vitrine: configuração do Strapi + cursos normalizados + posição na página. */
export interface CatalogoCursosExemplo {
  strapi: CatalogoCursosData;
  cursos: CursoResumoView[];
  index: number;
}
