import 'server-only';
import { ebaFetch, type OpcoesChamada } from './client';
import { definicaoDoTeste, type SlugTeste } from './testes';
import type { EbaQuestionApi } from './tipos';

export interface Pergunta {
  numero: number;
  texto: string;
}

/**
 * Perguntas do teste, ordenadas por número. Estilo pessoal usa pares locais (sem perguntas na API).
 * `timeoutMs`: padrão 10 s (renderização da página); as Server Actions pedem mais (API fria).
 */
export async function perguntasDoTeste(slug: SlugTeste, opcoes: OpcoesChamada = {}): Promise<Pergunta[]> {
  const teste = definicaoDoTeste(slug);
  if (!teste || teste.tipo === 'estilo') return [];
  const itens = await ebaFetch<EbaQuestionApi[]>(`Question/${teste.idQuestion}`, {
    cache: { revalidate: 3600, tags: ['eba-testes'] },
    ...opcoes,
  });
  return itens.map((q) => ({ numero: q.numberQuestion, texto: q.text })).sort((a, b) => a.numero - b.numero);
}
