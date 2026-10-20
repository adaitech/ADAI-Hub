import 'server-only';
import type { EbaErroApi } from './tipos';

const TIMEOUT_MS = 10_000;
const PREFIXO = 'api/v1/eba';

/** A API respondeu 4xx/5xx. A mensagem traz só o status e o código: nunca o corpo enviado nem a chave. */
export class EbaApiError extends Error {
  constructor(
    readonly status: number,
    readonly codigo: string | null,
  ) {
    super(`[eba-api] HTTP ${status}${codigo ? ` (${codigo})` : ''}`);
    this.name = 'EbaApiError';
  }
}

/** Variáveis ausentes, falha de rede ou timeout. */
export class EbaApiIndisponivel extends Error {
  constructor(motivo: string) {
    super(`[eba-api] indisponível: ${motivo}`);
    this.name = 'EbaApiIndisponivel';
  }
}

function configuracao(): { url: string; chave: string } | null {
  const url = process.env.EBA_API_URL?.trim();
  const chave = process.env.EBA_API_KEY?.trim();
  return url && chave ? { url: url.replace(/\/+$/, ''), chave } : null;
}

export function ebaApiConfigurada(): boolean {
  return configuracao() !== null;
}

interface EbaFetchInit {
  metodo?: 'GET' | 'POST';
  corpo?: unknown;
  cache?: { revalidate: number; tags: string[] };
}

/**
 * Único ponto de acesso à API da EBA, via API Management. Só servidor: `EBA_API_KEY` vai no header
 * `Ocp-Apim-Subscription-Key` (nunca na URL, em logs ou erros).
 * `caminho` não é codificado: quem chama deve usar `encodeURIComponent` nos trechos dinâmicos (ex.: e-mail).
 */
export async function ebaFetch<T>(caminho: string, init: EbaFetchInit = {}): Promise<T> {
  const config = configuracao();
  if (!config) throw new EbaApiIndisponivel('EBA_API_URL/EBA_API_KEY ausentes');

  const metodo = init.metodo ?? 'GET';
  const url = `${config.url}/${PREFIXO}/${caminho.replace(/^\/+/, '')}`;
  const headers: Record<string, string> = { 'Ocp-Apim-Subscription-Key': config.chave, Accept: 'application/json' };
  if (metodo === 'POST') headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(url, {
      method: metodo,
      headers,
      ...(metodo === 'POST' ? { body: JSON.stringify(init.corpo ?? {}), cache: 'no-store' as const } : init.cache ? { next: init.cache } : { cache: 'no-store' as const }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    const timeout = error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');
    throw new EbaApiIndisponivel(timeout ? 'timeout' : 'rede');
  }

  if (!response.ok) {
    const corpo = (await response.json().catch(() => null)) as EbaErroApi | null;
    throw new EbaApiError(response.status, corpo?.Erros?.[0]?.Code ?? null);
  }
  try {
    return (await response.json()) as T;
  } catch (error) {
    const timeout = error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');
    throw new EbaApiIndisponivel(timeout ? 'timeout' : 'resposta');
  }
}
