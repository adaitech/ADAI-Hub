import 'server-only';
import { z } from 'zod';
import { ebaFetch, EbaApiRespostaInvalida, TIMEOUT_ENVIO_MS, type OpcoesChamada } from './client';
import { descricaoDoEstilo, descricaoDoTemperamento } from './conteudo-local';
import { definicaoDoTeste, type SlugTeste } from './testes';
import type { EbaSurveyResponseEnvioApi } from './tipos';

export interface ItemResultado {
  nome: string;
  total: number;
  mensagem: string | null;
}

export type Resultado =
  | { tipo: 'pontuacao'; itens: ItemResultado[]; maximo: number }
  | { tipo: 'estilo'; combinacao: string; descricao: string | null; motivacao: number; organizacao: number }
  /**
   * A API gravou as respostas (2xx), mas devolveu um resultado fora do formato esperado: a tela
   * avisa que as respostas foram enviadas, sem "Tentar de novo" (reenviar duplicaria a gravação).
   */
  | { tipo: 'sem-resultado' };

/** Máximo por item nos testes de nota (5 por pergunta × 5 perguntas do dom). */
const MAXIMO_NOTA = 25;
/** A API guarda 0/1 por talento. */
const MAXIMO_TALENTO = 1;

/**
 * Itens de pontuação (nota, talentos, temperamento): `message` é opcional. Lista vazia não tem
 * resultado para mostrar: vira `EbaApiRespostaInvalida` (sem-resultado na tela).
 */
const esquemaItens = z
  .array(z.object({ name: z.string(), totalRate: z.number(), message: z.string().nullish().catch(null) }))
  .min(1);
const esquemaMensagem = z.object({ message: z.string() });
/** Estilo: `{message}` ou `[{message}]` (a forma real do POST ainda não foi observada). */
const esquemaEstilo = z.union([esquemaMensagem, z.tuple([esquemaMensagem], esquemaMensagem)]);

/**
 * Envia as respostas (já no formato da API: a UI agrega) e devolve o resultado do teste.
 * Nunca registra dados do aluno. Corpo 2xx fora do formato → `EbaApiRespostaInvalida` (as respostas
 * já foram gravadas pela API: quem chama não deve reenviar). Timeout padrão: `TIMEOUT_ENVIO_MS`.
 */
export async function enviarRespostas(
  e: {
    slug: SlugTeste;
    idStudent: string;
    idClass: string;
    respostas: { numero: number; nota: number }[];
  },
  opcoes: OpcoesChamada = {},
): Promise<Resultado> {
  const teste = definicaoDoTeste(e.slug);
  if (!teste) throw new Error(`[eba-api] teste desconhecido: ${e.slug}`);

  const corpo: EbaSurveyResponseEnvioApi = {
    responseQuestionList: e.respostas.map((r) => ({
      idStudent: e.idStudent,
      idClass: e.idClass,
      idQuestion: teste.idQuestion,
      numberQuestion: r.numero,
      rate: r.nota,
    })),
  };
  // 60 s por padrão: na API fria a gravação passa de 10 s, e um timeout antes dos cabeçalhos vira
  // `indisponivel` (o "Tentar de novo" poderia gravar em dobro).
  const retorno = await ebaFetch<unknown>('SurveyResponse', { metodo: 'POST', corpo, timeoutMs: opcoes.timeoutMs ?? TIMEOUT_ENVIO_MS });

  if (teste.tipo === 'estilo') {
    const valido = esquemaEstilo.safeParse(retorno);
    if (!valido.success) throw new EbaApiRespostaInvalida('SurveyResponse (estilo) sem message');
    const { message } = Array.isArray(valido.data) ? valido.data[0] : valido.data;
    const nota = (numero: number) => e.respostas.find((r) => r.numero === numero)?.nota ?? 0;
    return {
      tipo: 'estilo',
      combinacao: message,
      descricao: descricaoDoEstilo(message),
      motivacao: nota(1),
      organizacao: nota(2),
    };
  }

  const valido = esquemaItens.safeParse(retorno);
  if (!valido.success) throw new EbaApiRespostaInvalida('SurveyResponse sem lista de name/totalRate');
  const itens: ItemResultado[] = valido.data
    .map((i) => {
      // Temperamento: a API manda `name` fixo ("Temperamento Pessoal") e o temperamento em `message`.
      const rotulo = teste.tipo === 'temperamento' ? i.message?.trim() || i.name : i.name;
      return {
        nome: rotulo,
        total: i.totalRate,
        mensagem: teste.tipo === 'temperamento' ? descricaoDoTemperamento(rotulo) : i.message || null,
      };
    })
    .sort((a, b) => b.total - a.total);

  const maximo =
    teste.tipo === 'nota'
      ? MAXIMO_NOTA
      : teste.tipo === 'talentos'
        ? MAXIMO_TALENTO
        : itens.reduce((soma, i) => soma + i.total, 0);
  return { tipo: 'pontuacao', itens, maximo };
}
