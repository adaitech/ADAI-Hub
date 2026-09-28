import qs from 'qs';

export const STRAPI_URL = (process.env.NEXT_PUBLIC_STRAPI_URL ?? 'http://localhost:1337').replace(/\/$/, '');

/** Tag de cache de todo conteúdo vindo do Strapi (revalidada pelo webhook). */
export const STRAPI_CACHE_TAG = 'strapi';

/** Janela de revalidação por tempo, além do webhook. */
const REVALIDATE_SECONDS = 60;

export class StrapiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'StrapiError';
  }
}

interface StrapiFetchOptions {
  tags?: string[];
  /** Busca rascunhos (draft mode) sem cache. */
  draft?: boolean;
}

/**
 * Único ponto de acesso à API do Strapi. Só deve ser chamado no servidor,
 * pelas queries de `src/lib/strapi/queries/`.
 */
export async function strapiFetch<T>(
  path: string,
  query: Record<string, unknown> = {},
  { tags = [], draft = false }: StrapiFetchOptions = {},
): Promise<T> {
  const search = qs.stringify(draft ? { ...query, status: 'draft' } : query, { encodeValuesOnly: true });
  const url = `${STRAPI_URL}/api/${path}${search ? `?${search}` : ''}`;
  const token = process.env.STRAPI_API_TOKEN;
  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await fetch(
    url,
    draft
      ? { headers, cache: 'no-store' }
      : { headers, next: { revalidate: REVALIDATE_SECONDS, tags: [STRAPI_CACHE_TAG, ...tags] } },
  );

  if (!response.ok) {
    throw new StrapiError(`Strapi respondeu ${response.status} para /api/${path}`, response.status);
  }

  return (await response.json()) as T;
}
