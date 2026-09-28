const API_URL = 'https://www.googleapis.com/youtube/v3';
const TIMEOUT_MS = 8000;

/** Tag de cache de tudo que vem do YouTube (independente da tag `strapi`). */
export const YOUTUBE_CACHE_TAG = 'youtube';

export type YoutubeErrorKind = 'config' | 'quota' | 'http' | 'timeout' | 'rede' | 'resposta';

/**
 * Falha ao falar com o YouTube. A mensagem traz só o endpoint, o status e o motivo do Google:
 * nunca a URL completa, headers ou a chave.
 */
export class YoutubeError extends Error {
  constructor(
    readonly kind: YoutubeErrorKind,
    readonly endpoint: string,
    readonly status?: number,
    readonly reason?: string,
  ) {
    super(`[youtube] ${endpoint}: ${kind}${status ? ` ${status}` : ''}${reason ? ` (${reason})` : ''}`);
    this.name = 'YoutubeError';
  }
}

/** Handle do canal sem "@" (ex.: ADAIOficial). */
export function getChannelHandle(): string {
  const handle = process.env.YOUTUBE_CHANNEL_HANDLE?.trim().replace(/^@/, '');
  if (!handle) throw new YoutubeError('config', 'env', undefined, 'YOUTUBE_CHANNEL_HANDLE ausente');
  return handle;
}

/**
 * Único ponto de acesso à YouTube Data API v3. Só é importado por código de servidor; as variáveis
 * não têm `NEXT_PUBLIC_`, então nunca entram no bundle do navegador.
 * A chave vai no header `X-Goog-Api-Key`, fora da URL: não aparece em logs, erros nem chaves de cache.
 * Não cacheia sozinho: o cache fica em `serie-atual.ts` (resultado já normalizado).
 */
export async function youtubeFetch<T>(endpoint: string, params: Record<string, string | number>): Promise<T> {
  const key = process.env.YOUTUBE_API_KEY?.trim();
  if (!key) throw new YoutubeError('config', endpoint, undefined, 'YOUTUBE_API_KEY ausente');

  const search = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
  let response: Response;
  try {
    response = await fetch(`${API_URL}/${endpoint}?${search}`, {
      headers: { 'X-Goog-Api-Key': key, Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    const timeout = error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');
    throw new YoutubeError(timeout ? 'timeout' : 'rede', endpoint);
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: { errors?: { reason?: string }[] } } | null;
    const reason = body?.error?.errors?.[0]?.reason;
    const quota = response.status === 429 || reason === 'quotaExceeded' || reason === 'rateLimitExceeded';
    throw new YoutubeError(quota ? 'quota' : 'http', endpoint, response.status, reason);
  }

  const json = (await response.json().catch(() => null)) as T | null;
  if (!json || typeof json !== 'object') throw new YoutubeError('resposta', endpoint, response.status);
  return json;
}
