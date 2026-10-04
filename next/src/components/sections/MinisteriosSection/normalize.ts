import { normalizeBotoes, sanitizeHref } from '@/lib/strapi/links';
import type { MinisteriosData, MinisteriosView } from './types';

export const MAX_MINISTERIOS = 12;

/** Sem título ou ministérios válidos, a seção não aparece. */
export function normalizeMinisterios(data: MinisteriosData): MinisteriosView | null {
  const titulo = data.titulo?.trim();
  if (!titulo) return null;

  const ministerios = (data.ministerios ?? [])
    .map((item) => ({
      id: item.id,
      nome: item.nome?.trim() ?? '',
      publico: item.publico?.trim() || null,
      href: sanitizeHref(item.url),
    }))
    .filter((item) => item.nome)
    .slice(0, MAX_MINISTERIOS);
  if (ministerios.length === 0) return null;

  return {
    titulo,
    textoApoio: data.texto_apoio?.trim() || null,
    botao: normalizeBotoes(data.botao ? [data.botao] : [])[0] ?? null,
    ministerios,
    exibicao: data.exibicao === 'cards' ? 'cards' : 'lista',
  };
}
