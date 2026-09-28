import { revalidateTag } from 'next/cache';
import { STRAPI_CACHE_TAG } from '@/lib/strapi/client';

/**
 * Webhook do Strapi (Configurações → Webhooks): POST para /api/revalidate com o header
 * `x-revalidate-secret` igual a REVALIDATE_SECRET. Marca todo conteúdo do Strapi como desatualizado.
 */
export async function POST(request: Request) {
  const secret = request.headers.get('x-revalidate-secret');
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return Response.json({ revalidado: false, erro: 'Token inválido' }, { status: 401 });
  }

  revalidateTag(STRAPI_CACHE_TAG, 'max');
  return Response.json({ revalidado: true });
}
