import type { SlugTeste } from '@/lib/eba-api/testes';

/**
 * Fotos decorativas dos testes (copiadas do site antigo e convertidas por
 * `scripts/converter-fotos-testes.mjs`). Quantidade de fotos por pergunta de cada teste;
 * `talentos-naturais` só tem capa/resultado. O alt fica a cargo de quem renderiza (alt="").
 */
const FOTOS_POR_PERGUNTA: Record<SlugTeste, number> = {
  'dons-servico': 55,
  'dons-ministerio': 25,
  'talentos-naturais': 0,
  // índice = par de afirmações 1–14 (motivação 1–7, organização 8–14)
  'estilo-pessoal': 14,
  // uma foto por página de 10 opções
  'temperamento-pessoal': 20,
};

export type MomentoFoto = 'capa' | 'resultado' | 'identificacao' | { pergunta: number };

const BASE = '/eba/testes';

export function fotoDoTeste(slug: SlugTeste, momento: MomentoFoto): string {
  if (momento === 'identificacao') return `${BASE}/identificacao.webp`;
  if (momento === 'capa' || momento === 'resultado') return `${BASE}/${slug}/${momento}.webp`;
  const { pergunta } = momento;
  if (Number.isInteger(pergunta) && pergunta >= 1 && pergunta <= FOTOS_POR_PERGUNTA[slug]) {
    return `${BASE}/${slug}/${pergunta}.webp`;
  }
  return `${BASE}/${slug}/capa.webp`;
}
