import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { TAMANHO_MINIMO_SEGREDO } from './assinatura';

/**
 * Selo opaco e autenticado: `v1.` + base64url(iv | tag | cifrado), AES-256-GCM. O conteúdo fica
 * cifrado (quem vê o valor não lê os dados) e a tag impede forjar ou alterar. A chave é derivada do
 * segredo **e do uso** (`resultado`, `equipe`…): o selo de um recurso não abre em outro.
 */

const VERSAO = 'v1.';
const TAMANHO_IV = 12;
const TAMANHO_TAG = 16;

function chave(segredo: string, uso: string): Buffer {
  return createHash('sha256').update(`eba-selo:v1:${uso}:${segredo}`).digest();
}

export function selar(dados: object, segredo: string, uso: string): string {
  if (segredo.length < TAMANHO_MINIMO_SEGREDO) throw new Error('segredo do selo ausente ou curto');
  const iv = randomBytes(TAMANHO_IV);
  const cifra = createCipheriv('aes-256-gcm', chave(segredo, uso), iv);
  const cifrado = Buffer.concat([cifra.update(JSON.stringify(dados), 'utf8'), cifra.final()]);
  return VERSAO + Buffer.concat([iv, cifra.getAuthTag(), cifrado]).toString('base64url');
}

/** Nunca lança: malformado, adulterado, de outro segredo ou de outro uso → `null`. */
export function abrirSelo(valor: string | undefined, segredo: string, uso: string): unknown | null {
  if (!valor || !valor.startsWith(VERSAO) || segredo.length < TAMANHO_MINIMO_SEGREDO) return null;
  try {
    const bruto = Buffer.from(valor.slice(VERSAO.length), 'base64url');
    if (bruto.length <= TAMANHO_IV + TAMANHO_TAG) return null;
    const decifra = createDecipheriv('aes-256-gcm', chave(segredo, uso), bruto.subarray(0, TAMANHO_IV));
    decifra.setAuthTag(bruto.subarray(TAMANHO_IV, TAMANHO_IV + TAMANHO_TAG));
    const texto = Buffer.concat([decifra.update(bruto.subarray(TAMANHO_IV + TAMANHO_TAG)), decifra.final()]).toString('utf8');
    return JSON.parse(texto);
  } catch {
    return null;
  }
}
