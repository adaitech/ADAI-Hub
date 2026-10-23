import { createHmac, randomInt } from 'node:crypto';
import { normalizarEmail } from '@/lib/eba-api/alunos';

/**
 * Código de 6 dígitos dos testes da EBA e os hashes que vão para o Strapi (o Strapi nunca vê o e-mail
 * nem o código). HMAC-SHA256 com `EBA_SESSAO_SEGREDO`. Spec: 2026-10-21-migracao-eba-2-codigo-por-email-design.md.
 */

export const VALIDADE_CODIGO_MS = 600_000;

const hmac = (texto: string, segredo: string) => createHmac('sha256', segredo).update(texto).digest('base64url');

export function gerarCodigo(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

export function hashDoEmail(email: string, segredo: string): string {
  return hmac(`email:${normalizarEmail(email)}`, segredo);
}

export function hashDoCodigo(emailHash: string, codigo: string, segredo: string): string {
  return hmac(`codigo:${emailHash}:${codigo}`, segredo);
}

/** Código como a pessoa digitou ou colou ("123 456", "123-456"): só os 6 dígitos, ou null. */
export function soDigitos(codigo: string): string | null {
  if (typeof codigo !== 'string') return null;
  const digitos = codigo.replace(/[\s-]/g, '');
  return /^\d{6}$/.test(digitos) ? digitos : null;
}
