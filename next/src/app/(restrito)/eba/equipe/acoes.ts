'use server';

import { cookies, headers } from 'next/headers';
import { z } from 'zod';
import { criarLimitador, ipParaLimite } from '@/lib/eba/limite';
import { abrirSessaoEquipe, COOKIE_EQUIPE, OPCOES_COOKIE_EQUIPE, segredoDaEquipe } from '@/lib/eba/equipe/sessao';
import { sessaoDaEquipe } from '@/lib/eba/equipe/servidor';
import { ebaApiConfigurada, EbaApiError } from '@/lib/eba-api/client';
import {
  apagarTurma,
  buscarAlunos,
  criarTurma,
  CredenciaisInvalidas,
  editarTurma,
  entrar,
  idValido,
  listarAlunos,
  listarTurmas,
  SessaoEncerrada,
  turmaValida,
  type DadosTurma,
} from '@/lib/eba-api/equipe';

/**
 * Únicas ações da área da equipe (spec 2026-10-22, entrega 4). Regras de segurança:
 * - o login roda aqui, no servidor: a senha só passa por esta ação e o bearer fica num cookie `httpOnly`
 *   cifrado, nunca no navegador;
 * - toda ação de dados confere a sessão ANTES de qualquer chamada à API e usa só o bearer da sessão;
 * - sem `EBA_EQUIPE_SEGREDO` ou sem a API configurada, tudo falha fechado;
 * - mesma resposta para qualquer erro de credencial; limite de tentativas por IP;
 * - logs só com a classe do erro: nunca e-mail, nome, senha, bearer ou id.
 */

export type RespostaEquipe<T = undefined> =
  | { ok: true; dados?: T }
  | { ok: false; erro: 'invalido' | 'limite' | 'indisponivel' | 'sessao' | 'credenciais' | 'recusado' | 'turma-com-alunos' };

export interface AlunoDaBusca {
  id: string;
  nome: string;
  email: string;
  unidade: string;
  turma: string;
}

const ACAO = { ok: true } as const;
const falha = (erro: Extract<RespostaEquipe, { ok: false }>['erro']) => ({ ok: false, erro }) as const;

/** Força bruta no login: 5 por minuto por IP. */
const limitarLogin = criarLimitador(5, 60_000);
/** Buscas e escritas da equipe: limite próprio, bem acima do uso normal. */
const limitarAcoes = criarLimitador(60, 60_000);
const limitarEscritas = criarLimitador(20, 60_000);

async function dentroDoLimite(limitar: (chave: string, agora: number) => boolean): Promise<boolean> {
  const cabecalhos = await headers();
  return limitar(ipParaLimite(cabecalhos.get('x-forwarded-for')), Date.now());
}

function registrarFalha(acao: string, erro: unknown): void {
  console.warn(`[eba-equipe] ${acao}: ${erro instanceof Error ? erro.name : 'erro desconhecido'}`);
}

const esquemaEmail = z.string().trim().max(254).pipe(z.email());
const esquemaSenha = z.string().min(1).max(200);

/** Passo único do login. A senha nunca é registrada, devolvida nem guardada. */
export async function entrarNaEquipe(email: string, senha: string): Promise<RespostaEquipe> {
  if (!(await dentroDoLimite(limitarLogin))) return falha('limite');
  const segredo = segredoDaEquipe();
  if (!segredo || !ebaApiConfigurada()) return falha('indisponivel');

  const e = esquemaEmail.safeParse(email);
  const s = esquemaSenha.safeParse(senha);
  if (!e.success || !s.success) return falha('invalido');
  const emailNormalizado = e.data.toLowerCase();

  try {
    const { accessToken, expiresIn } = await entrar(emailNormalizado, s.data);
    const { valor } = abrirSessaoEquipe({ accessToken, email: emailNormalizado, expiresIn }, segredo, Date.now());
    (await cookies()).set(COOKIE_EQUIPE, valor, OPCOES_COOKIE_EQUIPE);
    return ACAO;
  } catch (erro) {
    if (erro instanceof CredenciaisInvalidas) return falha('credenciais');
    registrarFalha('entrar', erro);
    return falha('indisponivel');
  }
}

/** Encerra a sessão (apaga o cookie). */
export async function sairDaEquipe(): Promise<void> {
  (await cookies()).delete({ name: COOKIE_EQUIPE, path: OPCOES_COOKIE_EQUIPE.path });
}

/** Traduz o erro de uma chamada à API; sessão vencida vira `sessao` (a tela volta ao login). */
function traduzir(acao: string, erro: unknown): Extract<RespostaEquipe, { ok: false }> {
  if (erro instanceof SessaoEncerrada) return falha('sessao');
  registrarFalha(acao, erro);
  return falha(erro instanceof EbaApiError && erro.status === 400 ? 'recusado' : 'indisponivel');
}

/** Busca por e-mail ou nome, com o nome da turma já ao lado (uma chamada às turmas, não uma por aluno). */
export async function buscarAlunosAcao(consulta: string): Promise<RespostaEquipe<AlunoDaBusca[]>> {
  const sessao = await sessaoDaEquipe();
  if (!sessao) return falha('sessao');
  if (!(await dentroDoLimite(limitarAcoes))) return falha('limite');
  if (typeof consulta !== 'string' || consulta.trim() === '' || consulta.trim().length > 100) return falha('invalido');

  try {
    const [alunos, turmas] = await Promise.all([buscarAlunos(sessao.accessToken, consulta), listarTurmas(sessao.accessToken)]);
    const nomes = new Map(turmas.map((t) => [t.id, t.nome]));
    return { ok: true, dados: alunos.map((a) => ({ id: a.id, nome: a.nome, email: a.email, unidade: a.unidade, turma: nomes.get(a.idTurma) ?? 'Desconhecida' })) };
  } catch (erro) {
    return traduzir('buscarAlunos', erro);
  }
}

export async function criarTurmaAcao(dados: DadosTurma): Promise<RespostaEquipe> {
  const sessao = await sessaoDaEquipe();
  if (!sessao) return falha('sessao');
  if (!(await dentroDoLimite(limitarEscritas))) return falha('limite');
  if (!turmaValida(dados)) return falha('invalido');
  try {
    await criarTurma(sessao.accessToken, dados);
    return ACAO;
  } catch (erro) {
    return traduzir('criarTurma', erro);
  }
}

export async function editarTurmaAcao(dados: DadosTurma & { id: string }): Promise<RespostaEquipe> {
  const sessao = await sessaoDaEquipe();
  if (!sessao) return falha('sessao');
  if (!(await dentroDoLimite(limitarEscritas))) return falha('limite');
  if (!idValido(dados.id) || !turmaValida(dados)) return falha('invalido');
  try {
    await editarTurma(sessao.accessToken, dados);
    return ACAO;
  } catch (erro) {
    return traduzir('editarTurma', erro);
  }
}

/**
 * Apaga a turma só se ela não tem alunos (a API apaga em definitivo e não confere). Não conseguir contar
 * os alunos → não apaga (falha fechado).
 */
export async function apagarTurmaAcao(id: string): Promise<RespostaEquipe> {
  const sessao = await sessaoDaEquipe();
  if (!sessao) return falha('sessao');
  if (!(await dentroDoLimite(limitarEscritas))) return falha('limite');
  if (typeof id !== 'string' || !idValido(id)) return falha('invalido');
  try {
    const { total } = await listarAlunos(sessao.accessToken, { pagina: 1, tamanho: 1, idTurma: id });
    if (total > 0) return falha('turma-com-alunos');
    await apagarTurma(sessao.accessToken, id);
    return ACAO;
  } catch (erro) {
    return traduzir('apagarTurma', erro);
  }
}
