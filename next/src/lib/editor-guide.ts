import guides from '@/generated/editor-guide.json';

/** Formato de strapi/src/editor-guide/*.json (fonte única, copiada por scripts/sync-editor-guide.mjs). */
export interface EditorGuideField {
  campo: string;
  label: string;
  descricao: string;
  placeholder: string;
  ondeAparece: string;
  obrigatorio: boolean;
  limite: string;
  exemplo: string;
  componente?: string;
}

export interface EditorGuide {
  uid: string;
  nome: string;
  resumo: string;
  ondeAparece: string;
  boasPraticas: string[];
  campos: EditorGuideField[];
}

const allGuides = guides as Record<string, EditorGuide>;

export function getEditorGuide(uid: string): EditorGuide | null {
  return allGuides[uid] ?? null;
}
