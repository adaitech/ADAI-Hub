import { createHmac, timingSafeEqual } from 'node:crypto';

/** Sessão do aluno nos testes da EBA. Sem dado sensível: o e-mail vai mascarado. */
export interface SessaoAluno {
  idStudent: string;
  idClass: string;
  emailMascarado: string;
  emitidoEm: number;
}

export const COOKIE_SESSAO = 'eba_sessao';
/** Validade de 2 h, conferida no servidor (o cookie é de sessão, sem maxAge). */
export const VALIDADE_SESSAO_MS = 7_200_000;
/** Tolerância para relógios dessincronizados: emissão no futuro além disso é rejeitada. */
const TOLERANCIA_RELOGIO_MS = 60_000;

/** Cookie de sessão: sem `maxAge`/`expires` de propósito. */
export const OPCOES_COOKIE = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/eba/testes',
  secure: process.env.NODE_ENV === 'production',
} as const;

/** `ana@email.com` → `a***@email.com`. */
export function mascararEmail(email: string): string {
  const arroba = email.lastIndexOf('@');
  if (arroba < 1) return '***';
  return `${email.slice(0, 1)}***${email.slice(arroba)}`;
}

function assinar(payload: string, segredo: string): string {
  return createHmac('sha256', segredo).update(payload).digest('base64url');
}

/** `base64url(json).base64url(hmac-sha256)`. */
export function assinarSessao(s: SessaoAluno, segredo: string): string {
  const payload = Buffer.from(JSON.stringify(s)).toString('base64url');
  return `${payload}.${assinar(payload, segredo)}`;
}

function ehSessao(v: unknown): v is SessaoAluno {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.idStudent === 'string' &&
    typeof o.idClass === 'string' &&
    typeof o.emailMascarado === 'string' &&
    typeof o.emitidoEm === 'number' &&
    Number.isFinite(o.emitidoEm)
  );
}

/** Nunca lança: qualquer valor malformado, adulterado ou fora da validade devolve `null`. */
export function lerSessao(
  valor: string | undefined,
  segredo: string,
  agora: number,
): SessaoAluno | null {
  if (!valor) return null;
  const partes = valor.split('.');
  if (partes.length !== 2) return null;
  const [payload, assinatura] = partes;

  try {
    const esperada = Buffer.from(assinar(payload, segredo));
    const recebida = Buffer.from(assinatura);
    if (esperada.length !== recebida.length || !timingSafeEqual(esperada, recebida)) return null;

    const sessao: unknown = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!ehSessao(sessao)) return null;

    const idade = agora - sessao.emitidoEm;
    if (idade > VALIDADE_SESSAO_MS || idade < -TOLERANCIA_RELOGIO_MS) return null;
    return sessao;
  } catch {
    return null;
  }
}
