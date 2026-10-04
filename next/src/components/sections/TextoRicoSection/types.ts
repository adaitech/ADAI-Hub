/** JSON cru de `sections.texto-rico` (documento: política, termos, regulamentos). */
export interface TextoRicoData {
  __component: 'sections.texto-rico';
  id: number;
  titulo?: string | null;
  /** `YYYY-MM-DD` (campo Date do Strapi). */
  atualizado_em?: string | null;
  /** Markdown (campo Rich text (Markdown) do Strapi): ##, listas, tabelas, links. */
  conteudo?: string | null;
}

export interface TextoRicoView {
  /** Opcional: abaixo de um Hero, o título da página já é o do Hero. */
  titulo: string | null;
  /** "2 de outubro de 2026" ou null. */
  atualizadoEm: string | null;
  /** Data ISO para o `<time dateTime>`. */
  atualizadoEmIso: string | null;
  conteudo: string;
}
