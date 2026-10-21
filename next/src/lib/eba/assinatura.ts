import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Valores assinados dos cookies da EBA: `base64url(json).base64url(hmac-sha256)`. Usado pela sessão do
 * aluno e pelas marcas do aparelho e do e-mail verificado. Segredo curto → não assina e não lê.
 */

export const TAMANHO_MINIMO_SEGREDO = 32;

function hmac(payload: string, segredo: string): string {
  return createHmac('sha256', segredo).update(payload).digest('base64url');
}

export function assinarJson(dados: object, segredo: string): string {
  if (segredo.length < TAMANHO_MINIMO_SEGREDO) throw new Error('segredo da sessão ausente ou curto');
  const payload = Buffer.from(JSON.stringify(dados)).toString('base64url');
  return `${payload}.${hmac(payload, segredo)}`;
}

/** Nunca lança: malformado, adulterado ou assinado com outro segredo devolve `null`. */
export function lerJsonAssinado(valor: string | undefined, segredo: string): unknown | null {
  if (!valor || segredo.length < TAMANHO_MINIMO_SEGREDO) return null;
  const partes = valor.split('.');
  if (partes.length !== 2) return null;
  const [payload, assinatura] = partes;
  try {
    const esperada = Buffer.from(hmac(payload, segredo));
    const recebida = Buffer.from(assinatura);
    if (esperada.length !== recebida.length || !timingSafeEqual(esperada, recebida)) return null;
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}
