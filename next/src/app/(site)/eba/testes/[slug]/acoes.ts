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
import { EbaApiError, EbaApiIndisponivel, ebaApiConfigurada } from '@/lib/eba-api/client';
import { perguntasDoTeste } from '@/lib/eba-api/perguntas';
import { enviarRespostas, type Resultado } from '@/lib/eba-api/respostas';
import { definicaoDoTeste, UNIDADES, type SlugTeste } from '@/lib/eba-api/testes';
import { turmasAtivas, type Turma } from '@/lib/eba-api/turmas';

/**
 * Únicas ações que ligam a tela dos testes à API da EBA. Regras de segurança:
 * - ids do aluno só vêm da sessão assinada (cookie httpOnly), nunca do cliente;
 * - sem `EBA_SESSAO_SEGREDO` válido ou sem API configurada, tudo falha fechado (`indisponivel`);
 * - logs só com classe do erro/status/código: nunca e-mail, nome ou ids.
 */

export type RespostaAcao<T = undefined> =
  | { ok: true; dados?: T }
  | { ok: false; erro: 'invalido' | 'limite' | 'indisponivel' | 'sessao' | 'recusado' };

type Falha = { ok: false; erro: 'invalido' | 'limite' | 'indisponivel' | 'sessao' | 'recusado' };

const falha = (erro: Falha['erro']): Falha => ({ ok: false, erro });

const limitarTentativas = criarLimitador(10, 60_000);

/** Segredo válido e API configurada; senão as ações falham fechado. */
function configuracao(): { segredo: string } | null {
  const s = segredoDaSessao();
  return s && ebaApiConfigurada() ? { segredo: s } : null;
}

function registrarFalha(acao: string, erro: unknown): void {
  if (erro instanceof EbaApiError) {
    console.warn(`[eba-testes] ${acao}: EbaApiError status=${erro.status} codigo=${erro.codigo ?? '-'}`);
  } else if (erro instanceof EbaApiIndisponivel) {
    console.warn(`[eba-testes] ${acao}: EbaApiIndisponivel`);
  } else {
    console.warn(`[eba-testes] ${acao}: ${erro instanceof Error ? erro.name : 'erro desconhecido'}`);
  }
}

async function dentroDoLimite(): Promise<boolean> {
  const cabecalhos = await headers();
  const ip = cabecalhos.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  return limitarTentativas(ip, Date.now());
}

async function abrirSessao(aluno: { idStudent: string; idClass: string }, email: string, chave: string) {
  const emailMascarado = mascararEmail(email);
  const sessao: SessaoAluno = { ...aluno, emailMascarado, emitidoEm: Date.now() };
  (await cookies()).set(COOKIE_SESSAO, assinarSessao(sessao, chave), OPCOES_COOKIE);
  return emailMascarado;
}

const esquemaEmail = z.string().trim().max(254).pipe(z.email());

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
    const aluno = await alunoPorEmail(emailNormalizado);
    if (aluno) {
      const emailMascarado = await abrirSessao(aluno, emailNormalizado, config.segredo);
      return { ok: true, dados: { emailMascarado } };
    }
    return { ok: true, dados: { novo: true, turmas: await turmasAtivas() } };
  } catch (erro) {
    registrarFalha('identificar', erro);
    return falha('indisponivel');
  }
}

const esquemaCadastro = z.object({
  email: esquemaEmail,
  nome: z.string().trim().min(3).max(100),
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
    const turmas = await turmasAtivas();
    if (!turmas.some((t) => t.id === idTurma)) return falha('invalido');
    const aluno = await cadastrarAluno({ nome, email, unidade, idTurma });
    const emailMascarado = await abrirSessao(aluno, email, config.segredo);
    return { ok: true, dados: { emailMascarado } };
  } catch (erro) {
    registrarFalha('cadastrar', erro);
    return falha('indisponivel');
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
      const perguntas = await perguntasDoTeste(slug);
      return (
        cobreExatamente(respostas, perguntas.map((p) => p.numero)) &&
        respostas.every((r) => entre(r.nota, 0, 5))
      );
    }
    case 'talentos': {
      const perguntas = await perguntasDoTeste(slug);
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

export async function enviar(
  slug: string,
  respostas: { numero: number; nota: number }[],
): Promise<RespostaAcao<Resultado>> {
  const config = configuracao();
  if (!config) return falha('indisponivel');

  const sessao = lerSessao((await cookies()).get(COOKIE_SESSAO)?.value, config.segredo, Date.now());
  if (!sessao) return falha('sessao');

  const teste = definicaoDoTeste(typeof slug === 'string' ? slug : '');
  const lista = z.array(esquemaResposta).safeParse(respostas);
  if (!teste || !lista.success) return falha('invalido');

  try {
    if (!(await respostasValidas(teste.slug, lista.data))) return falha('invalido');
    const resultado = await enviarRespostas({
      slug: teste.slug,
      idStudent: sessao.idStudent,
      idClass: sessao.idClass,
      respostas: lista.data,
    });
    return { ok: true, dados: resultado };
  } catch (erro) {
    registrarFalha('enviar', erro);
    return falha(erro instanceof EbaApiError && erro.status === 400 ? 'recusado' : 'indisponivel');
  }
}

export async function sair(): Promise<void> {
  (await cookies()).delete({ name: COOKIE_SESSAO, path: OPCOES_COOKIE.path });
}

export async function sessaoAtual(): Promise<{ emailMascarado: string } | null> {
  const config = configuracao();
  if (!config) return null;
  const sessao = lerSessao((await cookies()).get(COOKIE_SESSAO)?.value, config.segredo, Date.now());
  return sessao ? { emailMascarado: sessao.emailMascarado } : null;
}
