import { TAMANHO_MINIMO_SEGREDO } from '../assinatura';
import { abrirSelo, selar } from '../selo';

/**
 * Sessão da equipe da EBA (spec 2026-10-22, entrega 4): o bearer do Identity fica só no servidor, num
 * cookie `httpOnly` cifrado (`selo.ts`). Vale pela validade do token (com 30 s de margem), no máximo 8 h.
 */

export const COOKIE_EQUIPE = 'eba_equipe';
const USO = 'equipe';
/** Teto da sessão, mesmo que o token dure mais. */
export const VALIDADE_MAXIMA_SESSAO_MS = 8 * 3_600_000;
const MARGEM_MS = 30_000;

export interface SessaoEquipe {
  accessToken: string;
  email: string;
}

/** `EBA_EQUIPE_SEGREDO` (só servidor) com 32+ caracteres; ausente ou curto → null (a área fica desligada, 404). */
export function segredoDaEquipe(): string | null {
  const valor = process.env.EBA_EQUIPE_SEGREDO ?? '';
  return valor.length >= TAMANHO_MINIMO_SEGREDO ? valor : null;
}

/** Cookie de sessão (sem `maxAge`), só no caminho da área e sem enviar em navegação de outro site. */
export const OPCOES_COOKIE_EQUIPE = {
  httpOnly: true,
  sameSite: 'strict',
  path: '/eba/equipe',
  secure: process.env.NODE_ENV === 'production',
} as const;

/** `expiresIn` em segundos, como o Identity devolve. Menor que a margem ou inválido → lança. */
export function abrirSessaoEquipe(
  dados: { accessToken: string; email: string; expiresIn: number },
  segredo: string,
  agora: number,
): { valor: string; expiraEm: number } {
  const { accessToken, email, expiresIn } = dados;
  if (!accessToken || !Number.isFinite(expiresIn) || expiresIn * 1000 <= MARGEM_MS) throw new Error('sessão da equipe inválida');
  const expiraEm = agora + Math.min(expiresIn * 1000 - MARGEM_MS, VALIDADE_MAXIMA_SESSAO_MS);
  return { valor: selar({ accessToken, email, exp: expiraEm }, segredo, USO), expiraEm };
}

/** Nunca lança: qualquer valor malformado, adulterado ou vencido devolve `null`. */
export function lerSessaoEquipe(valor: string | undefined, segredo: string, agora: number): SessaoEquipe | null {
  const d = abrirSelo(valor, segredo, USO) as Record<string, unknown> | null;
  if (!d || typeof d.accessToken !== 'string' || d.accessToken === '' || typeof d.email !== 'string' || typeof d.exp !== 'number' || !Number.isFinite(d.exp)) return null;
  if (agora > d.exp) return null;
  return { accessToken: d.accessToken, email: d.email };
}
