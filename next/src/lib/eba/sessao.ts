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
/** Tamanho mínimo do segredo (EBA_SESSAO_SEGREDO); abaixo disso a assinatura é forjável. */
export const TAMANHO_MINIMO_SEGREDO = 32;
/** Tolerância para relógios dessincronizados: emissão no futuro além disso é rejeitada. */
const TOLERANCIA_RELOGIO_MS = 60_000;

/** `EBA_SESSAO_SEGREDO` (só servidor) quando tem o tamanho mínimo; ausente ou curto → null (testes indisponíveis). */
export function segredoDaSessao(): string | null {
  const valor = process.env.EBA_SESSAO_SEGREDO ?? '';
  return valor.length >= TAMANHO_MINIMO_SEGREDO ? valor : null;
}

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

/**
 * Identificador opaco do dono das respostas: HMAC do `idStudent` (22 caracteres, sem dado pessoal).
 * Não usa o e-mail mascarado, que se repete entre pessoas (`ana@` e `alice@` viram `a***@`).
 */
export function donoDaSessao(idStudent: string, segredo: string): string {
  return assinar(`dono:${idStudent}`, segredo).slice(0, 22);
}

/** `base64url(json).base64url(hmac-sha256)`. */
export function assinarSessao(s: SessaoAluno, segredo: string): string {
  if (segredo.length < TAMANHO_MINIMO_SEGREDO) throw new Error('segredo da sessão ausente ou curto');
  const payload = Buffer.from(JSON.stringify(s)).toString('base64url');
  return `${payload}.${assinar(payload, segredo)}`;
}

function ehSessao(v: unknown): v is SessaoAluno {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.idStudent === 'string' &&
    o.idStudent !== '' &&
    typeof o.idClass === 'string' &&
    o.idClass !== '' &&
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
  if (!valor || segredo.length < TAMANHO_MINIMO_SEGREDO) return null;
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
    return {
      idStudent: sessao.idStudent,
      idClass: sessao.idClass,
      emailMascarado: sessao.emailMascarado,
      emitidoEm: sessao.emitidoEm,
    };
  } catch {
    return null;
  }
}
