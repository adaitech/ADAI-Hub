import 'server-only';
import { z } from 'zod';
import { ebaFetch, EbaApiError, EbaApiRespostaInvalida, TIMEOUT_ACAO_MS, type OpcoesChamada } from './client';
import { SessaoEncerrada } from './equipe';
import { descricaoDoEstilo } from './conteudo-local';
import { resultadoDeItens, type Resultado } from './respostas';
import { TESTES, type DefinicaoTeste } from './testes';

export interface ResultadoDoTeste {
  teste: DefinicaoTeste;
  resultado: Resultado;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const esquemaLinhas = z.array(z.object({ result: z.boolean().nullish() }).passthrough());
const esquemaMensagem = z.object({ message: z.string().min(1) });

/**
 * A API marca em `result` o resultado vigente. Com linhas marcadas, só elas valem; sem nenhuma
 * marcada, valem todas (a ser confirmado em homologação: spec §7, pergunta 4).
 */
function vigentes(retorno: unknown): unknown {
  const linhas = esquemaLinhas.safeParse(retorno);
  if (!linhas.success) return retorno;
  const marcadas = linhas.data.filter((l) => l.result === true);
  return marcadas.length > 0 ? marcadas : linhas.data;
}

function normalizar(teste: DefinicaoTeste, retorno: unknown): Resultado {
  try {
    const linhas = vigentes(retorno);
    if (teste.tipo === 'estilo') {
      const primeira = esquemaMensagem.safeParse(Array.isArray(linhas) ? linhas[0] : linhas);
      if (!primeira.success) throw new EbaApiRespostaInvalida('SurveyResult (estilo) sem message');
      const { message } = primeira.data;
      // O resultado salvo não traz as somas dos eixos (só a combinação).
      return { tipo: 'estilo', combinacao: message, descricao: descricaoDoEstilo(message), motivacao: null, organizacao: null };
    }
    return resultadoDeItens(teste, linhas);
  } catch (erro) {
    if (erro instanceof EbaApiRespostaInvalida) return { tipo: 'sem-resultado' };
    throw erro;
  }
}

/**
 * Resultados salvos dos testes feitos pelo aluno (`GET Hub/SurveyResult/Student/{id}/Question/{idQuestion}`,
 * os 5 em paralelo, rota da API só para o Hub: sem login da equipe e sem dado pessoal), na ordem da apostila. 404 = teste não feito: fica de fora. Qualquer outra falha
 * (401/403 da autorização, 5xx, timeout) lança. O id vira UUID validado antes de entrar no caminho.
 * Nunca registra id, nome nem corpo.
 */
export async function resultadosDoAluno(idStudent: string, opcoes: OpcoesChamada & { bearer?: string } = {}): Promise<ResultadoDoTeste[]> {
  if (!UUID.test(idStudent)) throw new Error('[eba-api] id do aluno inválido');
  const id = encodeURIComponent(idStudent);
  const timeoutMs = opcoes.timeoutMs ?? TIMEOUT_ACAO_MS;
  // Com o bearer da equipe: a consulta existente da API. Sem ele: a rota do Hub (fechada por chave interna).
  const prefixo = opcoes.bearer ? '' : 'Hub/';
  const autorizacao = opcoes.bearer ? { bearer: opcoes.bearer } : {};
  const buscas = await Promise.all(
    TESTES.map(async (teste) => {
      try {
        const retorno = await ebaFetch<unknown>(`${prefixo}SurveyResult/Student/${id}/Question/${teste.idQuestion}`, { timeoutMs, ...autorizacao });
        return { teste, resultado: normalizar(teste, retorno) };
      } catch (erro) {
        if (erro instanceof EbaApiError && erro.status === 404) return null;
        if (opcoes.bearer && erro instanceof EbaApiError && erro.status === 401) throw new SessaoEncerrada();
        throw erro;
      }
    }),
  );
  return buscas.filter((b): b is ResultadoDoTeste => b !== null);
}
