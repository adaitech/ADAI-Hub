'use server';

import { cookies, headers } from 'next/headers';
import { z } from 'zod';
import { criarLimitador } from '@/lib/eba/limite';
import {
  assinarSessao,
  COOKIE_SESSAO,
  lerSessao,
  mascararEmail,
  OPCOES_COOKIE,
  segredoDaSessao,
  type SessaoAluno,
} from '@/lib/eba/sessao';
import { alunoPorEmail, cadastrarAluno, normalizarEmail } from '@/lib/eba-api/alunos';
import {
  EbaApiError,
  EbaApiIndisponivel,
  EbaApiRespostaInvalida,
  ebaApiConfigurada,
  TIMEOUT_ACAO_MS,
  TIMEOUT_ENVIO_MS,
} from '@/lib/eba-api/client';
import { perguntasDoTeste, type Pergunta } from '@/lib/eba-api/perguntas';
import { enviarRespostas, type Resultado } from '@/lib/eba-api/respostas';
import { definicaoDoTeste, UNIDADES, type SlugTeste } from '@/lib/eba-api/testes';
import { aquecerApi, turmasAtivas, type Turma } from '@/lib/eba-api/turmas';

/**
 * Únicas ações que ligam a tela dos testes à API da EBA. Regras de segurança:
 * - ids do aluno só vêm da sessão assinada (cookie httpOnly), nunca do cliente;
 * - sem `EBA_SESSAO_SEGREDO` válido ou sem API configurada, tudo falha fechado (`indisponivel`);
 * - logs só com classe do erro/status/código: nunca e-mail, nome ou ids.
 *
 * API fria: o banco da API pausa quando fica ocioso e a primeira chamada leva de 10 a 45 s. Por
 * isso as chamadas daqui usam `TIMEOUT_ACAO_MS` (45 s) e o envio, `TIMEOUT_ENVIO_MS` (60 s).
 */

export type RespostaAcao<T = undefined> =
  | { ok: true; dados?: T }
  | { ok: false; erro: 'invalido' | 'limite' | 'indisponivel' | 'sessao' | 'recusado' };

type Falha = { ok: false; erro: 'invalido' | 'limite' | 'indisponivel' | 'sessao' | 'recusado' };

const falha = (erro: Falha['erro']): Falha => ({ ok: false, erro });

const limitarTentativas = criarLimitador(10, 60_000);
/** Aquecimento: limite próprio (não gasta as tentativas do identificar), mesma chave (IP). */
const limitarAquecimento = criarLimitador(5, 60_000);
const ACAO = { timeoutMs: TIMEOUT_ACAO_MS };
const ENVIO = { timeoutMs: TIMEOUT_ENVIO_MS };

/** Segredo válido e API configurada; senão as ações falham fechado. */
function configuracao(): { segredo: string } | null {
  const s = segredoDaSessao();
  return s && ebaApiConfigurada() ? { segredo: s } : null;
}

function registrarFalha(acao: string, erro: unknown): void {
  if (erro instanceof EbaApiError) {
    console.warn(`[eba-testes] ${acao}: EbaApiError status=${erro.status} codigo=${erro.codigo ?? '-'}`);
  } else if (erro instanceof EbaApiIndisponivel || erro instanceof EbaApiRespostaInvalida) {
    console.warn(`[eba-testes] ${acao}: ${erro.name}`);
  } else {
    console.warn(`[eba-testes] ${acao}: ${erro instanceof Error ? erro.name : 'erro desconhecido'}`);
  }
}

async function dentroDoLimite(limitar = limitarTentativas): Promise<boolean> {
  const cabecalhos = await headers();
  const ip = cabecalhos.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  return limitar(ip, Date.now());
}

async function abrirSessao(aluno: { idStudent: string; idClass: string }, email: string, chave: string) {
  const emailMascarado = mascararEmail(email);
  const sessao: SessaoAluno = { ...aluno, emailMascarado, emitidoEm: Date.now() };
  (await cookies()).set(COOKIE_SESSAO, assinarSessao(sessao, chave), OPCOES_COOKIE);
  return emailMascarado;
}

const esquemaEmail = z.string().trim().max(254).pipe(z.email());

/**
 * Sessão do cookie, ou null. Cookie presente mas vencido ou adulterado é apagado (spec §5.3).
 * Na renderização do Server Component o cookie é só leitura: a tentativa é ignorada e o
 * próximo `enviar` (Server Action) apaga.
 */
async function sessaoDoCookie(segredo: string): Promise<SessaoAluno | null> {
  const cofre = await cookies();
  const valor = cofre.get(COOKIE_SESSAO)?.value;
  const sessao = lerSessao(valor, segredo, Date.now());
  if (!sessao && valor) {
    try {
      cofre.delete({ name: COOKIE_SESSAO, path: OPCOES_COOKIE.path });
    } catch {
      // Renderização (cookies só leitura): fica para a próxima Server Action.
    }
  }
  return sessao;
}

export async function identificar(
  email: string,
): Promise<RespostaAcao<{ emailMascarado: string } | { novo: true; turmas: Turma[] }>> {
  if (!(await dentroDoLimite())) return falha('limite');
  const config = configuracao();
  if (!config) return falha('indisponivel');

  const valido = esquemaEmail.safeParse(email);
  if (!valido.success) return falha('invalido');
  const emailNormalizado = normalizarEmail(valido.data);

  try {
    const aluno = await alunoPorEmail(emailNormalizado, ACAO);
    if (aluno) {
      const emailMascarado = await abrirSessao(aluno, emailNormalizado, config.segredo);
      return { ok: true, dados: { emailMascarado } };
    }
    return { ok: true, dados: { novo: true, turmas: await turmasAtivas(ACAO) } };
  } catch (erro) {
    registrarFalha('identificar', erro);
    return falha('indisponivel');
  }
}

const esquemaCadastro = z.object({
  email: esquemaEmail,
  // Sem caracteres de controle (quebra de linha, tabulação, nulo…): o nome vai para o painel da EBA.
  nome: z.string().trim().min(3).max(100).refine((nome) => !/\p{Cc}/u.test(nome)),
  unidade: z.enum(UNIDADES.map((u) => u.valor) as [string, ...string[]]),
  idTurma: z.string().min(1).max(100),
});

export async function cadastrar(dados: {
  email: string;
  nome: string;
  unidade: string;
  idTurma: string;
}): Promise<RespostaAcao<{ emailMascarado: string }>> {
  if (!(await dentroDoLimite())) return falha('limite');
  const config = configuracao();
  if (!config) return falha('indisponivel');

  const valido = esquemaCadastro.safeParse(dados);
  if (!valido.success) return falha('invalido');
  const { nome, unidade, idTurma } = valido.data;
  const email = normalizarEmail(valido.data.email);

  try {
    // E-mail já cadastrado (outra aba, clique duplo, cadastro feito em outro aparelho): abre a
    // sessão como no `identificar`, sem criar um aluno duplicado.
    const existente = await alunoPorEmail(email, ACAO);
    if (existente) {
      return { ok: true, dados: { emailMascarado: await abrirSessao(existente, email, config.segredo) } };
    }
    const turmas = await turmasAtivas(ACAO);
    if (!turmas.some((t) => t.id === idTurma)) return falha('invalido');
    const aluno = await cadastrarAluno({ nome, email, unidade, idTurma }, ACAO);
    const emailMascarado = await abrirSessao(aluno, email, config.segredo);
    return { ok: true, dados: { emailMascarado } };
  } catch (erro) {
    registrarFalha('cadastrar', erro);
    return falha(erro instanceof EbaApiError && erro.status === 400 ? 'recusado' : 'indisponivel');
  }
}

const esquemaResposta = z.object({ numero: z.number().int(), nota: z.number().int() });

type RespostaTeste = { numero: number; nota: number };

function numerosUnicos(respostas: RespostaTeste[]): Set<number> | null {
  const numeros = new Set(respostas.map((r) => r.numero));
  return numeros.size === respostas.length ? numeros : null;
}

/** Uma resposta para cada número esperado, sem repetição nem extras. */
function cobreExatamente(respostas: RespostaTeste[], esperados: number[]): boolean {
  const numeros = numerosUnicos(respostas);
  return (
    numeros !== null && numeros.size === esperados.length && esperados.every((n) => numeros.has(n))
  );
}

const entre = (nota: number, min: number, max: number) => nota >= min && nota <= max;

/** Valida as respostas já agregadas, no formato da API, conforme o tipo do teste. */
async function respostasValidas(slug: SlugTeste, respostas: RespostaTeste[]): Promise<boolean> {
  const tipo = definicaoDoTeste(slug)?.tipo;
  switch (tipo) {
    case 'nota': {
      const perguntas = await perguntasDoTeste(slug, ACAO);
      return (
        cobreExatamente(respostas, perguntas.map((p) => p.numero)) &&
        respostas.every((r) => entre(r.nota, 0, 5))
      );
    }
    case 'talentos': {
      const perguntas = await perguntasDoTeste(slug, ACAO);
      if (!cobreExatamente(respostas, perguntas.map((p) => p.numero))) return false;
      if (!respostas.every((r) => r.nota === 0 || r.nota === 1)) return false;
      const marcados = respostas.filter((r) => r.nota === 1).length;
      return marcados >= 1 && marcados <= 3;
    }
    case 'estilo':
      return cobreExatamente(respostas, [1, 2]) && respostas.every((r) => entre(r.nota, 7, 35));
    case 'temperamento':
      return cobreExatamente(respostas, [1, 2, 3, 4]) && respostas.every((r) => entre(r.nota, 0, 50));
    default:
      return false;
  }
}

/** E-mail mascarado do dono das respostas, como o cliente guardou no progresso. */
const esquemaRespondidoComo = z.string().max(260).refine((v) => v.trim() !== '');

/**
 * Envia as respostas com os ids da sessão. `respondidoComo` é o e-mail mascarado da sessão em que as
 * respostas foram dadas: se a sessão do cookie for de outra pessoa (trocada em outra aba), devolve
 * `sessao` sem chamar a API, para as respostas de uma pessoa não serem gravadas como de outra.
 */
export async function enviar(
  slug: string,
  respostas: { numero: number; nota: number }[],
  respondidoComo: string,
): Promise<RespostaAcao<Resultado>> {
  const config = configuracao();
  if (!config) return falha('indisponivel');

  const sessao = await sessaoDoCookie(config.segredo);
  if (!sessao) return falha('sessao');

  const dono = esquemaRespondidoComo.safeParse(respondidoComo);
  if (!dono.success) return falha('invalido');
  if (dono.data !== sessao.emailMascarado) return falha('sessao');

  const teste = definicaoDoTeste(typeof slug === 'string' ? slug : '');
  const lista = z.array(esquemaResposta).safeParse(respostas);
  if (!teste || !lista.success) return falha('invalido');

  try {
    if (!(await respostasValidas(teste.slug, lista.data))) return falha('invalido');
    const resultado = await enviarRespostas(
      {
        slug: teste.slug,
        idStudent: sessao.idStudent,
        idClass: sessao.idClass,
        respostas: lista.data,
      },
      ENVIO,
    );
    return { ok: true, dados: resultado };
  } catch (erro) {
    registrarFalha('enviar', erro);
    // 2xx com corpo fora do formato: a API já gravou as respostas. Sucesso sem resultado, para a
    // tela não oferecer "Tentar de novo" (reenviar duplicaria a gravação).
    if (erro instanceof EbaApiRespostaInvalida) return { ok: true, dados: { tipo: 'sem-resultado' } };
    return falha(erro instanceof EbaApiError && erro.status === 400 ? 'recusado' : 'indisponivel');
  }
}

/**
 * Acorda o banco da API (ele pausa quando fica ocioso) enquanto a pessoa lê a abertura: um GET leve
 * e sem cache. Nunca lança e nunca devolve dados. Não chama a API acima de 5 por minuto por IP nem
 * sem configuração ou segredo (falha fechado).
 */
export async function aquecer(): Promise<void> {
  try {
    if (!(await dentroDoLimite(limitarAquecimento))) return;
    if (!configuracao()) return;
    await aquecerApi(ACAO);
  } catch (erro) {
    // Só a classe do erro: o aquecimento é uma tentativa, e a próxima ação mostra a falha real.
    console.warn(`[eba-testes] aquecer: ${erro instanceof Error ? erro.name : 'erro desconhecido'}`);
  }
}

/**
 * Perguntas do teste quando a busca na renderização falhou (API fria passa dos 10 s da página):
 * "Começar" tenta de novo com 45 s. Estilo pessoal não usa perguntas da API (`[]`).
 */
export async function carregarPerguntas(slug: string): Promise<RespostaAcao<Pergunta[]>> {
  const teste = definicaoDoTeste(typeof slug === 'string' ? slug : '');
  if (!teste) return falha('invalido');
  if (!(await dentroDoLimite())) return falha('limite');
  if (!configuracao()) return falha('indisponivel');
  if (teste.tipo === 'estilo') return { ok: true, dados: [] };

  try {
    return { ok: true, dados: await perguntasDoTeste(teste.slug, ACAO) };
  } catch (erro) {
    registrarFalha('carregarPerguntas', erro);
    return falha('indisponivel');
  }
}

export async function sair(): Promise<void> {
  (await cookies()).delete({ name: COOKIE_SESSAO, path: OPCOES_COOKIE.path });
}

export async function sessaoAtual(): Promise<{ emailMascarado: string } | null> {
  const config = configuracao();
  if (!config) return null;
  const sessao = await sessaoDoCookie(config.segredo);
  return sessao ? { emailMascarado: sessao.emailMascarado } : null;
}
