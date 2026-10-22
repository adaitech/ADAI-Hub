import { TAMANHO_MINIMO_SEGREDO } from './assinatura';
import { abrirSelo, selar } from './selo';

/**
 * Link do resultado dos testes: selo opaco (`selo.ts`, uso `resultado`). O conteúdo
 * `{ p, idStudent, iat, exp }` fica cifrado: quem vê a URL não lê o id do aluno e não forja nem
 * altera o código (a tag autentica). Sem estado: não dá para revogar um link só (trocar o segredo
 * invalida todos).
 */

const PROPOSITO = 'resultado';
/** Teto de validade (30 dias), conferido na emissão e na leitura. */
export const VALIDADE_MAXIMA_LINK_MS = 30 * 86_400_000;
/** Tolerância para relógios dessincronizados: emissão no futuro além disso é rejeitada. */
const TOLERANCIA_RELOGIO_MS = 60_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** `EBA_RESULTADO_SEGREDO` (só servidor) com 32+ caracteres; ausente ou curto → null (rota desligada). */
export function segredoDoResultado(): string | null {
  const valor = process.env.EBA_RESULTADO_SEGREDO ?? '';
  return valor.length >= TAMANHO_MINIMO_SEGREDO ? valor : null;
}

export function ehIdDeAluno(valor: unknown): valor is string {
  return typeof valor === 'string' && UUID.test(valor);
}

export function emitirLinkResultado(
  idStudent: string,
  opcoes: { segredo: string; validadeMs: number; agora: number },
): string {
  const { segredo, validadeMs, agora } = opcoes;
  if (segredo.length < TAMANHO_MINIMO_SEGREDO) throw new Error('segredo do resultado ausente ou curto');
  if (!ehIdDeAluno(idStudent)) throw new Error('id do aluno inválido');
  if (!Number.isFinite(validadeMs) || validadeMs <= 0 || validadeMs > VALIDADE_MAXIMA_LINK_MS) {
    throw new Error('validade do link inválida');
  }
  return selar({ p: PROPOSITO, idStudent, iat: agora, exp: agora + validadeMs }, segredo, PROPOSITO);
}

/** Nunca lança: malformado, adulterado, de outro segredo, de outro uso ou fora da validade → `null`. */
export function lerLinkResultado(
  codigo: string | undefined,
  segredo: string,
  agora: number,
): { idStudent: string } | null {
  const d = abrirSelo(codigo, segredo, PROPOSITO) as Record<string, unknown> | null;
  if (
    !d ||
    d.p !== PROPOSITO ||
    !ehIdDeAluno(d.idStudent) ||
    typeof d.iat !== 'number' ||
    typeof d.exp !== 'number' ||
    !Number.isFinite(d.iat) ||
    !Number.isFinite(d.exp)
  ) {
    return null;
  }
  if (d.exp - d.iat > VALIDADE_MAXIMA_LINK_MS || d.iat - agora > TOLERANCIA_RELOGIO_MS || agora > d.exp) return null;
  return { idStudent: d.idStudent };
}
