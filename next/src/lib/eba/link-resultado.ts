import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { TAMANHO_MINIMO_SEGREDO } from './assinatura';

/**
 * Link do resultado dos testes: `v1.` + base64url(iv | tag | cifrado), AES-256-GCM. O conteúdo
 * `{ p, idStudent, iat, exp }` fica cifrado: quem vê a URL não lê o id do aluno e não forja nem
 * altera o código (a tag autentica). Sem estado: não dá para revogar um link só (trocar o segredo
 * invalida todos).
 */

const VERSAO = 'v1.';
const PROPOSITO = 'resultado';
const TAMANHO_IV = 12;
const TAMANHO_TAG = 16;
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

/** Chave própria deste uso, derivada do segredo (nunca a mesma da sessão). */
function chave(segredo: string): Buffer {
  return createHash('sha256').update(`eba-resultado:v1:${segredo}`).digest();
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
  const iv = randomBytes(TAMANHO_IV);
  const cifra = createCipheriv('aes-256-gcm', chave(segredo), iv);
  const texto = JSON.stringify({ p: PROPOSITO, idStudent, iat: agora, exp: agora + validadeMs });
  const cifrado = Buffer.concat([cifra.update(texto, 'utf8'), cifra.final()]);
  return VERSAO + Buffer.concat([iv, cifra.getAuthTag(), cifrado]).toString('base64url');
}

/** Nunca lança: malformado, adulterado, de outro segredo, de outro uso ou fora da validade → `null`. */
export function lerLinkResultado(
  codigo: string | undefined,
  segredo: string,
  agora: number,
): { idStudent: string } | null {
  if (!codigo || !codigo.startsWith(VERSAO) || segredo.length < TAMANHO_MINIMO_SEGREDO) return null;
  try {
    const bruto = Buffer.from(codigo.slice(VERSAO.length), 'base64url');
    if (bruto.length <= TAMANHO_IV + TAMANHO_TAG) return null;
    const iv = bruto.subarray(0, TAMANHO_IV);
    const tag = bruto.subarray(TAMANHO_IV, TAMANHO_IV + TAMANHO_TAG);
    const decifra = createDecipheriv('aes-256-gcm', chave(segredo), iv);
    decifra.setAuthTag(tag);
    const texto = Buffer.concat([decifra.update(bruto.subarray(TAMANHO_IV + TAMANHO_TAG)), decifra.final()]).toString('utf8');
    const d = JSON.parse(texto) as Record<string, unknown>;
    if (
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
  } catch {
    return null;
  }
}
