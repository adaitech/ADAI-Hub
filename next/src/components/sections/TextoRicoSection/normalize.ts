import type { TextoRicoData, TextoRicoView } from './types';

const formatoData = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/** Sem conteúdo, a seção não é exibida. Título é opcional (abaixo de um Hero). Data inválida é ignorada. */
export function normalizeTextoRico(data: TextoRicoData): TextoRicoView | null {
  const titulo = data.titulo?.trim() || null;
  const conteudo = data.conteudo?.trim();
  if (!conteudo) return null;

  const iso = data.atualizado_em?.trim().slice(0, 10) ?? '';
  const valida = /^\d{4}-\d{2}-\d{2}$/.test(iso) && !Number.isNaN(Date.parse(`${iso}T00:00:00Z`));

  return {
    titulo,
    atualizadoEm: valida ? formatoData.format(new Date(`${iso}T00:00:00Z`)) : null,
    atualizadoEmIso: valida ? iso : null,
    conteudo,
  };
}
