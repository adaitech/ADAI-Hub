const BASE_PADRAO = 'https://api.inchurch.com.br/public';
const TIMEOUT_MS = 8000;

/** Tag de cache de tudo que vem da inChurch (independente de `strapi` e `youtube`). */
export const INCHURCH_CACHE_TAG = 'inchurch';

export type InchurchErrorKind = 'config' | 'limite' | 'http' | 'timeout' | 'rede' | 'resposta';

/** Falha ao falar com a inChurch. A mensagem traz só endpoint, status e código de erro da API. */
export class InchurchError extends Error {
  constructor(
    readonly kind: InchurchErrorKind,
    readonly endpoint: string,
    readonly status?: number,
    readonly code?: string,
  ) {
    super(`[inchurch] ${endpoint}: ${kind}${status ? ` ${status}` : ''}${code ? ` (${code})` : ''}`);
    this.name = 'InchurchError';
  }
}

/**
 * Único ponto de acesso à inChurch Public API. Só servidor: `INCHURCH_API_KEY` e
 * `INCHURCH_API_SECRET` nunca têm `NEXT_PUBLIC_` e vão só no header
 * `Authorization: Basic base64(key:secret)` (nunca na URL, em logs ou erros).
 * Parâmetros repetidos (ex.: `category_id`) vão como pares `[chave, valor]`.
 */
export async function inchurchFetch<T>(endpoint: string, params: [string, string | number][] = []): Promise<T> {
  const key = process.env.INCHURCH_API_KEY?.trim();
  const secret = process.env.INCHURCH_API_SECRET?.trim();
  if (!key || !secret) throw new InchurchError('config', endpoint, undefined, 'INCHURCH_API_KEY/INCHURCH_API_SECRET ausentes');

  const base = (process.env.INCHURCH_API_BASE_PUBLIC?.trim() || BASE_PADRAO).replace(/\/$/, '');
  const url = new URL(`${base}/${endpoint.replace(/^\//, '')}`);
  for (const [chave, valor] of params) url.searchParams.append(chave, String(valor));

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}`,
        Accept: 'application/json',
        'X-API-Version': 'v1',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    const timeout = error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');
    throw new InchurchError(timeout ? 'timeout' : 'rede', endpoint);
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: { code?: string } } | null;
    throw new InchurchError(response.status === 429 ? 'limite' : 'http', endpoint, response.status, body?.error?.code);
  }

  const json = (await response.json().catch(() => null)) as T | null;
  if (!json || typeof json !== 'object') throw new InchurchError('resposta', endpoint, response.status);
  return json;
}
