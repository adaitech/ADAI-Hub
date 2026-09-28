import type { PerguntasFrequentesData, PerguntasFrequentesView } from './types';

export const MAX_PERGUNTAS = 12;

export function normalizePerguntasFrequentes(data: PerguntasFrequentesData): PerguntasFrequentesView | null {
  const titulo = data.titulo?.trim();
  if (!titulo) return null;
  const perguntas = (data.perguntas ?? [])
    .map((item) => ({ id: item.id, pergunta: item.pergunta?.trim() ?? '', resposta: item.resposta?.trim() ?? '' }))
    .filter((item) => item.pergunta && item.resposta)
    .slice(0, MAX_PERGUNTAS);
  if (perguntas.length === 0) return null;

  return { titulo, textoApoio: data.texto_apoio?.trim() || null, perguntas };
}
