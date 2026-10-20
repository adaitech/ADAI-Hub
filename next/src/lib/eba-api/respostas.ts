import 'server-only';
import { ebaFetch } from './client';
import { descricaoDoEstilo, descricaoDoTemperamento } from './conteudo-local';
import { definicaoDoTeste, type SlugTeste } from './testes';
import type { EbaResultadoEstiloApi, EbaResultadoItemApi, EbaSurveyResponseEnvioApi } from './tipos';

export interface ItemResultado {
  nome: string;
  total: number;
  mensagem: string | null;
}

export type Resultado =
  | { tipo: 'pontuacao'; itens: ItemResultado[]; maximo: number }
  | { tipo: 'estilo'; combinacao: string; descricao: string | null; motivacao: number; organizacao: number };

/** Máximo por item nos testes de nota (5 por pergunta × 5 perguntas do dom). */
const MAXIMO_NOTA = 25;
/** A API guarda 0/1 por talento. */
const MAXIMO_TALENTO = 1;

/**
 * Envia as respostas (já no formato da API: a UI agrega) e devolve o resultado do teste.
 * Nunca registra dados do aluno.
 */
export async function enviarRespostas(e: {
  slug: SlugTeste;
  idStudent: string;
  idClass: string;
  respostas: { numero: number; nota: number }[];
}): Promise<Resultado> {
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
  const retorno = await ebaFetch<EbaResultadoItemApi[] | EbaResultadoEstiloApi | EbaResultadoEstiloApi[]>(
    'SurveyResponse',
    { metodo: 'POST', corpo },
  );

  if (teste.tipo === 'estilo') {
    const { message } = Array.isArray(retorno) ? (retorno[0] as EbaResultadoEstiloApi) : (retorno as EbaResultadoEstiloApi);
    const nota = (numero: number) => e.respostas.find((r) => r.numero === numero)?.nota ?? 0;
    return {
      tipo: 'estilo',
      combinacao: message,
      descricao: descricaoDoEstilo(message),
      motivacao: nota(1),
      organizacao: nota(2),
    };
  }

  const itens: ItemResultado[] = (retorno as EbaResultadoItemApi[])
    .map((i) => ({
      nome: i.name,
      total: i.totalRate,
      mensagem: teste.tipo === 'temperamento' ? descricaoDoTemperamento(i.name) : i.message || null,
    }))
    .sort((a, b) => b.total - a.total);

  const maximo =
    teste.tipo === 'nota'
      ? MAXIMO_NOTA
      : teste.tipo === 'talentos'
        ? MAXIMO_TALENTO
        : itens.reduce((soma, i) => soma + i.total, 0);
  return { tipo: 'pontuacao', itens, maximo };
}
