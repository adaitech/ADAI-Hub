import 'server-only';
import { ebaFetch, EbaApiError } from './client';
import type { EbaStudentApi, EbaStudentNovoApi } from './tipos';

export interface AlunoIdentificado {
  idStudent: string;
  idClass: string;
}

export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Aluno pelo e-mail; null se não existe (404). Nunca registra e-mail ou nome. */
export async function alunoPorEmail(email: string): Promise<AlunoIdentificado | null> {
  try {
    const aluno = await ebaFetch<EbaStudentApi>(`Student/email/${encodeURIComponent(normalizarEmail(email))}`);
    return { idStudent: aluno.id, idClass: aluno.idClass };
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
  return { idStudent: aluno.id, idClass: aluno.idClass };
}
