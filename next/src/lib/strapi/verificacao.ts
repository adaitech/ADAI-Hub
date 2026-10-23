import { STRAPI_URL } from './client';

/**
 * Rotas do tipo privado `verificacao-eba` do Strapi (código por e-mail dos testes da EBA). Só servidor:
 * POST sem cache, com o API token "Custom" `STRAPI_TOKEN_VERIFICACAO` (só emitir, conferir e cancelar).
 * Recebe e envia só hashes. Spec: docs/superpowers/specs/2026-10-21-migracao-eba-2-codigo-por-email-design.md.
 */

const TIMEOUT_MS = 10_000;
const RESULTADOS = ['ok', 'errado', 'esgotado', 'vencido'] as const;

export type ResultadoVerificacao = { resultado: (typeof RESULTADOS)[number]; restantes: number };

/** Strapi fora, token recusado, timeout ou resposta fora do formato. Nunca carrega dados no texto. */
export class VerificacaoIndisponivel extends Error {
  constructor(readonly status?: number) {
    super(status ? `verificação respondeu ${status}` : 'verificação indisponível');
    this.name = 'VerificacaoIndisponivel';
  }
}

export function verificacaoConfigurada(): boolean {
  return Boolean(process.env.STRAPI_TOKEN_VERIFICACAO);
}

async function postar(rota: 'emitir' | 'conferir' | 'cancelar', corpo: object): Promise<Response> {
  const token = process.env.STRAPI_TOKEN_VERIFICACAO;
  if (!token) throw new VerificacaoIndisponivel();
  try {
    return await fetch(`${STRAPI_URL}/api/verificacoes-eba/${rota}`, {
      method: 'POST',
      cache: 'no-store',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new VerificacaoIndisponivel();
  }
}

export async function emitirVerificacao(d: { emailHash: string; codigoHash: string; expiraEm: Date }): Promise<'emitido' | 'limite'> {
  const resposta = await postar('emitir', { emailHash: d.emailHash, codigoHash: d.codigoHash, expiraEm: d.expiraEm.toISOString() });
  if (resposta.status === 429) return 'limite';
  if (!resposta.ok) throw new VerificacaoIndisponivel(resposta.status);
  return 'emitido';
}

/**
 * Desfaz uma emissão cujo e-mail não saiu (devolve a cota de 3 envios por 15 min). Nunca lança: é só um
 * desfazer, e se falhar a emissão apenas vence sozinha.
 */
export async function cancelarVerificacao(d: { emailHash: string; codigoHash: string }): Promise<void> {
  try {
    await postar('cancelar', d);
  } catch {
    // Sem log: o aviso não pode carregar hash.
  }
}

export async function conferirVerificacao(d: { emailHash: string; codigoHash: string }): Promise<ResultadoVerificacao> {
  const resposta = await postar('conferir', d);
  if (!resposta.ok) throw new VerificacaoIndisponivel(resposta.status);
  const corpo = (await resposta.json().catch(() => null)) as Partial<ResultadoVerificacao> | null;
  const valido =
    corpo !== null &&
    RESULTADOS.includes(corpo.resultado as ResultadoVerificacao['resultado']) &&
    Number.isInteger(corpo.restantes) &&
    (corpo.restantes as number) >= 0;
  if (!valido) throw new VerificacaoIndisponivel(resposta.status);
  return { resultado: corpo.resultado as ResultadoVerificacao['resultado'], restantes: corpo.restantes as number };
}
