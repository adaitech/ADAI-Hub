import { idIgrejaValido } from '@/lib/inchurch/eventos';
import { strapiFetch } from '../client';
import type { StrapiCollectionResponse } from '../types';

interface StrapiUnidade {
  nome?: unknown;
  igreja_inchurch_id?: unknown;
}

export interface UnidadeInchurch {
  nome: string;
  igrejaId: number;
}

/**
 * Unidades do Strapi associadas à igreja na inChurch. Cada ID é único e a saída fica em ordem
 * numérica para tornar o resultado estável; Strapi fora → `[]` (a agenda mostra todos os eventos).
 */
export async function getUnidadesInchurch(): Promise<UnidadeInchurch[]> {
  try {
    const response = await strapiFetch<StrapiCollectionResponse<StrapiUnidade>>('unidades', {
      fields: ['nome', 'igreja_inchurch_id'],
      pagination: { pageSize: 100 },
    });
    const porIgreja = new Map<number, UnidadeInchurch>();

    for (const unidade of response.data ?? []) {
      const igrejaId = idIgrejaValido(unidade.igreja_inchurch_id);
      const nome = typeof unidade.nome === 'string' ? unidade.nome.trim() : '';
      if (igrejaId === null || !nome || porIgreja.has(igrejaId)) continue;
      porIgreja.set(igrejaId, { nome, igrejaId });
    }

    return [...porIgreja.values()].sort((a, b) => a.igrejaId - b.igrejaId);
  } catch (error) {
    console.warn(`[strapi] Unidades indisponíveis (${error instanceof Error ? error.message : 'erro desconhecido'}): agenda sem filtro por unidade.`);
    return [];
  }
}

/** Mantém o contrato de IDs usado pelas seções existentes. */
export async function getIgrejasInchurch(): Promise<number[]> {
  return (await getUnidadesInchurch()).map((unidade) => unidade.igrejaId);
}
