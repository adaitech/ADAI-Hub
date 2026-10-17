import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import { diaEmSaoPaulo } from '@/lib/youtube/domingos';
import { getUnidadesInchurch, type UnidadeInchurch } from '@/lib/strapi/queries/unidades';
import { INCHURCH_CACHE_TAG, InchurchError, inchurchFetch } from './client';
import { normalizeDetalhe, normalizeDetalheAdministrativo, normalizarUnidadesAdministrativas, type EventoDetalhe } from './detalhes';
import { CATEGORIA_GRUPO_DE_CONEXAO, normalizeEventos, paraIsoSaoPaulo, type EventosInchurch } from './eventos';
import type { InchurchEvento, InchurchLista } from './types';
import { getEventoAdministrativo } from './admin-client';

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

/**
 * `igrejas`: IDs das Unidades cadastradas no Strapi. O JSON do evento não diz a igreja
 * (`responsible_church` vem null), mas o filtro `church_id` sim: uma busca por igreja.
 * Se qualquer busca falhar, a recarga inteira falha (nunca um mapa parcial).
 */
async function carregarEventos(igrejas: readonly number[]): Promise<EventosInchurch> {
  const [todos, gcs, ...porIgreja] = await Promise.all([
    listarEventos(),
    listarEventos([['category_id', CATEGORIA_GRUPO_DE_CONEXAO]]),
    ...igrejas.map((id) => listarEventos([['church_id', id]])),
  ]);
  const igrejaPorEvento = new Map<number, number[]>();
  porIgreja.forEach((eventos, i) => eventos.forEach((evento) => {
    const ids = igrejaPorEvento.get(evento.id) ?? [];
    if (!ids.includes(igrejas[i])) ids.push(igrejas[i]);
    igrejaPorEvento.set(evento.id, ids);
  }));

  const idsGc = new Set(gcs.map((e) => e.id));
  // Confirmar unidades de publicação: church_id pode omitir eventos publicados em várias igrejas.
  // Apenas eventos aprovados pela fonte pública; leitura administrativa compartilhada com os detalhes.
  const candidatos = [...new Map(todos.map((evento) => [evento.id, evento])).values()]
    .filter((evento) => normalizeEventos([evento], idsGc).eventos.length > 0);
  for (let inicio = 0; inicio < candidatos.length; inicio += 4) {
    await Promise.all(candidatos.slice(inicio, inicio + 4).map(async (evento) => {
      try {
        const admin = await getEventoAdministrativo(evento.id);
        const unidades = normalizarUnidadesAdministrativas(admin, []);
        if (Array.isArray(admin.units) || admin.tertiarygroup) {
          igrejaPorEvento.set(evento.id, unidades.map((unidade) => unidade.igrejaId));
        }
      } catch {
        // Preservar associações públicas confirmadas em caso de indisponibilidade administrativa.
      }
    }));
  }
  const dados = normalizeEventos(todos, idsGc, new Date(), igrejaPorEvento);
  // Só roda em cache miss (no máximo 1x a cada 30 min).
  const resumoIgrejas = igrejas.map((id, i) => `${id}: ${porIgreja[i].length}`).join(', ');
  console.info(`[inchurch] Eventos atualizados: ${todos.length} futuros → ${dados.eventos.length} no site.${resumoIgrejas ? ` Por igreja: ${resumoIgrejas}.` : ''}`);
  return dados;
}

/**
 * Versão do formato guardado no cache (resultado normalizado, pode sobreviver a um deploy).
 * Ao mudar `EventosInchurch`, suba este número. Guardado por `cache-versionado.test.ts`.
 */
export const VERSAO_CACHE_INCHURCH = 7;

const eventosCache = unstable_cache(carregarEventos, ['inchurch', 'eventos', `v${VERSAO_CACHE_INCHURCH}`], {
  revalidate: TTL_EVENTOS_S,
  tags: [INCHURCH_CACHE_TAG],
});

let ultimoValido: EventosInchurch | null = null;

/** Apenas para testes. */
export function __limparUltimoValido(): void {
  ultimoValido = null;
  ultimosDetalhes.clear();
}

/**
 * Eventos do site vindos da inChurch (`igrejas` = IDs das Unidades; entram na chave do cache).
 * Nunca lança: com a inChurch fora, usa a versão anterior
 * (Data Cache do Next ou memória); sem nenhuma → `null` (a seção some, a página fica de pé).
 */
export async function getEventosInchurch(igrejas: readonly number[] = []): Promise<EventosInchurch | null> {
  try {
    const dados = await eventosCache([...new Set(igrejas)].sort((a, b) => a - b));
    ultimoValido = dados;
    return dados;
  } catch (error) {
    console.warn(
      `[inchurch] Eventos indisponíveis (${error instanceof Error ? error.message : 'erro desconhecido'}): ${ultimoValido ? 'usando o último resultado válido' : 'seção oculta'}.`,
    );
    return ultimoValido;
  }
}

const detalhesCache = unstable_cache(async (id: number, unidade: UnidadeInchurch | null) => {
  try {
    const raw = await inchurchFetch<InchurchEvento>(`v1/event/${id}/`);
    if (raw.id !== id || !raw.name?.trim() || !paraIsoSaoPaulo(raw.start_datetime)
      || typeof raw.active !== 'boolean' || typeof raw.enabled !== 'boolean') {
      throw new InchurchError('resposta', 'v1/event/:id/');
    }
    return normalizeDetalhe(raw, unidade);
  } catch (error) {
    if (error instanceof InchurchError && error.status === 404) return null;
    throw error; // Falhas temporárias não entram no cache.
  }
}, ['inchurch', 'evento-detalhe-publico', 'v5'], { revalidate: TTL_EVENTOS_S, tags: [INCHURCH_CACHE_TAG] });

/** Guarda só a projeção pública normalizada, nunca o objeto administrativo cru. */
const detalhesAdminCache = unstable_cache(async (id: number, publico: EventoDetalhe, unidades: UnidadeInchurch[]) => {
  try {
    return normalizeDetalheAdministrativo(await getEventoAdministrativo(id), publico, unidades);
  } catch (error) {
    if (error instanceof InchurchError && error.status === 404) return null;
    throw error; // Falhas administrativas não são cacheadas como dados vazios.
  }
}, ['inchurch', 'evento-detalhe-admin', 'v8'], { revalidate: TTL_EVENTOS_S, tags: [INCHURCH_CACHE_TAG] });

const ultimosDetalhes = new Map<number, EventoDetalhe>();
type ResultadoDetalhe = { estado: 'ok'; evento: EventoDetalhe; relacionados: EventosInchurch } | { estado: 'nao-encontrado' | 'indisponivel' };

/** Compartilhado entre metadata e página; reutiliza o cadastro e o cache de unidades da Agenda. */
export const getEventoDetalhe = cache(async (id: number): Promise<ResultadoDetalhe> => {
  if (!Number.isSafeInteger(id) || id <= 0) return { estado: 'nao-encontrado' };
  const unidades = await getUnidadesInchurch();
  const relacionados = await getEventosInchurch(unidades.map((unidade) => unidade.igrejaId));
  if (!relacionados) return { estado: 'indisponivel' };
  if (relacionados.idsCategoriaGc?.includes(id)) return { estado: 'nao-encontrado' };
  const igrejaId = relacionados.eventos.find((evento) => evento.id === id)?.igrejaId;
  const unidade = unidades.find((unidade) => unidade.igrejaId === igrejaId) ?? null;
  try {
    // A validação pública acontece antes de qualquer leitura administrativa ou fallback.
    const publico = await detalhesCache(id, unidade);
    if (!publico) { ultimosDetalhes.delete(id); return { estado: 'nao-encontrado' }; }
    let evento: EventoDetalhe | null;
    try {
      evento = await detalhesAdminCache(id, publico, unidades);
    } catch {
      console.warn('[inchurch] Detalhes administrativos indisponíveis: usando dados públicos ou última versão válida.');
      evento = ultimosDetalhes.get(id) ?? publico;
    }
    if (!evento) { ultimosDetalhes.delete(id); return { estado: 'nao-encontrado' }; }
    if (ultimosDetalhes.size >= 100) ultimosDetalhes.delete(ultimosDetalhes.keys().next().value!);
    ultimosDetalhes.set(id, evento);
    return { estado: 'ok', evento, relacionados };
  } catch {
    const evento = ultimosDetalhes.get(id);
    return evento ? { estado: 'ok', evento, relacionados } : { estado: 'indisponivel' };
  }
});
