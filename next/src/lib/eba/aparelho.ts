import { assinarJson, lerJsonAssinado } from './assinatura';
import { OPCOES_COOKIE } from './sessao';

/**
 * Marcas assinadas do código por e-mail: `eba_aparelho` (este aparelho já confirmou o código deste
 * e-mail; 7 dias: em aparelho compartilhado, quem digita o e-mail da pessoa entra sem código) e `eba_email_verificado` (código certo de um e-mail ainda sem cadastro; 15 min).
 * Guardam só o hash do e-mail e a data. A validade é conferida no servidor.
 */

export const COOKIE_APARELHO = 'eba_aparelho';
export const COOKIE_EMAIL_VERIFICADO = 'eba_email_verificado';
/** Código certo do pedido do link do resultado: permite o "Tentar de novo" sem outro código (15 min). */
export const COOKIE_RESULTADO_VERIFICADO = 'eba_resultado_verificado';
export const VALIDADE_APARELHO_MS = 604_800_000;
export const VALIDADE_EMAIL_VERIFICADO_MS = 900_000;
const TOLERANCIA_RELOGIO_MS = 60_000;

export function assinarMarca(emailHash: string, segredo: string, agora: number): string {
  return assinarJson({ emailHash, emitidoEm: agora }, segredo);
}

export function lerMarca(valor: string | undefined, segredo: string, agora: number, validadeMs: number): { emailHash: string } | null {
  const dados = lerJsonAssinado(valor, segredo) as { emailHash?: unknown; emitidoEm?: unknown } | null;
  if (!dados || typeof dados.emailHash !== 'string' || dados.emailHash === '' || typeof dados.emitidoEm !== 'number') return null;
  const idade = agora - dados.emitidoEm;
  if (idade > validadeMs || idade < -TOLERANCIA_RELOGIO_MS) return null;
  return { emailHash: dados.emailHash };
}

export function opcoesCookieMarca(validadeMs: number) {
  return { ...OPCOES_COOKIE, maxAge: Math.round(validadeMs / 1000) };
}

/** Opções do cookie do pedido do resultado: no caminho da própria página, não no dos testes. */
export function opcoesCookieResultado() {
  return { ...opcoesCookieMarca(VALIDADE_EMAIL_VERIFICADO_MS), path: '/eba/resultado' };
}
