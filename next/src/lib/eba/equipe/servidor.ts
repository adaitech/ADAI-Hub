import 'server-only';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { COOKIE_EQUIPE, lerSessaoEquipe, segredoDaEquipe, type SessaoEquipe } from './sessao';

/** Sessão do cookie, ou null (sem cookie, vencida, adulterada ou área desligada). */
export async function sessaoDaEquipe(): Promise<SessaoEquipe | null> {
  const segredo = segredoDaEquipe();
  if (!segredo) return null;
  return lerSessaoEquipe((await cookies()).get(COOKIE_EQUIPE)?.value, segredo, Date.now());
}

/**
 * Guarda das páginas da área: sem `EBA_EQUIPE_SEGREDO` → 404 (área desligada, igual a qualquer rota
 * inexistente); sem sessão válida → login. Toda página de `/eba/equipe/*` (menos o login) chama esta função.
 */
export async function exigirSessaoDaEquipe(): Promise<SessaoEquipe> {
  if (!segredoDaEquipe()) notFound();
  const sessao = await sessaoDaEquipe();
  if (!sessao) redirect('/eba/equipe/login');
  return sessao;
}
