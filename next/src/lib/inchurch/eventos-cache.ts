import { unstable_cache } from 'next/cache';
import { diaEmSaoPaulo } from '@/lib/youtube/domingos';
import { INCHURCH_CACHE_TAG, inchurchFetch } from './client';
import { CATEGORIA_GRUPO_DE_CONEXAO, normalizeEventos, type EventosInchurch } from './eventos';
import type { InchurchEvento, InchurchLista } from './types';

/** Eventos mudam pouco e o limite é 200 req/min: 30 min de cache. */
export const TTL_EVENTOS_S = 1800;
/** Trava de segurança da paginação (100 por página). */
const MAX_PAGINAS = 5;

/** Todos os eventos a partir de hoje (paginado de 100 em 100). */
async function listarEventos(extra: [string, string | number][] = []): Promise<InchurchEvento[]> {
  const hoje = `${diaEmSaoPaulo(new Date())}T00:00:00`;
  const eventos: InchurchEvento[] = [];
  for (let pagina = 0; pagina < MAX_PAGINAS; pagina++) {
    const resposta = await inchurchFetch<InchurchLista<InchurchEvento>>('v1/event/', [
      ['start_after', hoje],
      ['ordering', 'start_datetime'],
      ['limit', 100],
      ['offset', pagina * 100],
      ...extra,
    ]);
    eventos.push(...(resposta.results ?? []));
    if (!resposta.next) break;
  }
  return eventos;
}

async function carregarEventos(): Promise<EventosInchurch> {
  const [todos, gcs] = await Promise.all([listarEventos(), listarEventos([['category_id', CATEGORIA_GRUPO_DE_CONEXAO]])]);
  const dados = normalizeEventos(todos, new Set(gcs.map((e) => e.id)));
  // Só roda em cache miss (no máximo 1x a cada 30 min).
  console.info(`[inchurch] Eventos atualizados: ${todos.length} futuros → ${dados.eventos.length} no site.`);
  return dados;
}

const eventosCache = unstable_cache(carregarEventos, ['inchurch', 'eventos'], {
  revalidate: TTL_EVENTOS_S,
  tags: [INCHURCH_CACHE_TAG],
});

let ultimoValido: EventosInchurch | null = null;

/** Apenas para testes. */
export function __limparUltimoValido(): void {
  ultimoValido = null;
}

/**
 * Eventos do site vindos da inChurch. Nunca lança: com a inChurch fora, usa a versão anterior
 * (Data Cache do Next ou memória); sem nenhuma → `null` (a seção some, a página fica de pé).
 */
export async function getEventosInchurch(): Promise<EventosInchurch | null> {
  try {
    const dados = await eventosCache();
    ultimoValido = dados;
    return dados;
  } catch (error) {
    console.warn(
      `[inchurch] Eventos indisponíveis (${error instanceof Error ? error.message : 'erro desconhecido'}): ${ultimoValido ? 'usando o último resultado válido' : 'seção oculta'}.`,
    );
    return ultimoValido;
  }
}
