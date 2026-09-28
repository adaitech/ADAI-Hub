import { normalizeBotoes } from '@/lib/strapi/links';
import type { TextoBotoesData, TextoBotoesView } from './types';

export const TEXTO_BOTOES_MAX_BOTOES = 2;

export function normalizeTextoBotoes(data: TextoBotoesData): TextoBotoesView | null {
  const titulo = data.titulo?.trim();
  if (!titulo) return null;
  return {
    titulo,
    textoApoio: data.texto_apoio?.trim() || null,
    botoes: normalizeBotoes(data.botoes).slice(0, TEXTO_BOTOES_MAX_BOTOES),
  };
}
