import { idIgrejaValido } from '@/lib/inchurch/eventos';
import { strapiFetch } from '../client';
import type { StrapiCollectionResponse } from '../types';

interface StrapiUnidade {
  igreja_inchurch_id?: unknown;
}

/**
 * IDs de igreja da inChurch de todas as Unidades cadastradas no Strapi (para separar os eventos
 * por unidade). Únicos e em ordem; Strapi fora → `[]` (a agenda mostra todos os eventos).
 */
export async function getIgrejasInchurch(): Promise<number[]> {
  try {
    const response = await strapiFetch<StrapiCollectionResponse<StrapiUnidade>>('unidades', {
      fields: ['igreja_inchurch_id'],
      pagination: { pageSize: 100 },
    });
    const ids = (response.data ?? []).map((u) => idIgrejaValido(u.igreja_inchurch_id)).filter((id): id is number => id !== null);
    return [...new Set(ids)].sort((a, b) => a - b);
  } catch (error) {
    console.warn(`[strapi] Unidades indisponíveis (${error instanceof Error ? error.message : 'erro desconhecido'}): agenda sem filtro por unidade.`);
    return [];
  }
}
