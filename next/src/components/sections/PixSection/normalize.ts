import { normalizeLink } from '@/lib/strapi/links';
import { splitLines } from '@/utils/text';
import type { PixData } from './types';

export function normalizePix(data: PixData) {
  const titulo = data.titulo?.trim();
  const chave = data.chave_pix?.trim();
  if (!titulo || !chave) return null;
  return {
    titulo,
    chave,
    apoio: data.texto_apoio?.trim() || null,
    passos: splitLines(data.passos),
    contato: normalizeLink(data.contato),
    ancora: data.ancora && /^[a-z][a-z0-9-]*$/.test(data.ancora) ? data.ancora : undefined,
  };
}
