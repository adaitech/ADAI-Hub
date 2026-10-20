import 'server-only';
import { z } from 'zod';
import { ebaFetch, EbaApiError, EbaApiRespostaInvalida } from './client';
import type { EbaStudentApi, EbaStudentNovoApi } from './tipos';

export interface AlunoIdentificado {
  idStudent: string;
  idClass: string;
}

export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

const textoNaoVazio = z.string().refine((v) => v.trim() !== '');
const esquemaStudent = z.object({ id: textoNaoVazio, idClass: textoNaoVazio });

/** Só os ids do Student; sem `id`/`idClass` em texto não vazio a sessão não pode ser aberta. */
function alunoDaResposta(retorno: unknown, origem: 'GET' | 'POST'): AlunoIdentificado {
  const valido = esquemaStudent.safeParse(retorno);
  if (!valido.success) throw new EbaApiRespostaInvalida(`Student (${origem}) sem id/idClass`);
  return { idStudent: valido.data.id, idClass: valido.data.idClass };
}

/** Aluno pelo e-mail; null se não existe (404). Nunca registra e-mail ou nome. */
export async function alunoPorEmail(email: string): Promise<AlunoIdentificado | null> {
  try {
    const aluno = await ebaFetch<EbaStudentApi>(`Student/email/${encodeURIComponent(normalizarEmail(email))}`);
    return alunoDaResposta(aluno, 'GET');
  } catch (error) {
    if (error instanceof EbaApiError && error.status === 404) return null;
    throw error;
  }
}

export async function cadastrarAluno(dados: {
  nome: string;
  email: string;
  unidade: string;
  idTurma: string;
}): Promise<AlunoIdentificado> {
  const corpo: EbaStudentNovoApi = {
    name: dados.nome,
    email: normalizarEmail(dados.email),
    room: dados.unidade,
    idClass: dados.idTurma,
  };
  const aluno = await ebaFetch<EbaStudentApi>('Student', { metodo: 'POST', corpo });
  return alunoDaResposta(aluno, 'POST');
}
