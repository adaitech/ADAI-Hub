import 'server-only';
import { unstable_cache } from 'next/cache';
import { INCHURCH_CACHE_TAG, InchurchError } from './client';
import type { InchurchEventoAdministrativo } from './types';

const ENDPOINT = 'inchurch_event/:id/';

/** Único acesso administrativo: GET de um evento, sem proxy, sessão ou credencial na URL. */
async function buscarEventoAdministrativo(id: number): Promise<InchurchEventoAdministrativo> {
  if (!Number.isSafeInteger(id) || id <= 0) throw new InchurchError('resposta', ENDPOINT);
  const credencial = process.env.INCHURCH_ADMIN_API_KEY?.trim();
  if (!credencial || !/^ApiKey\s+[^\s:]+:\S+$/.test(credencial) || /[\r\n]/.test(credencial)) throw new InchurchError('config', ENDPOINT);
  let url: URL;
  try {
    const base = (process.env.INCHURCH_API_BASE_ADMIN?.trim() || 'https://www.inradar.com.br/api/v2').replace(/\/$/, '');
    url = new URL(`${base}/inchurch_event/${id}/`);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error();
  } catch { throw new InchurchError('config', ENDPOINT); }
  // Discriminador fixo usado pelo painel; a credencial continua exclusivamente no header.
  url.searchParams.set('auth', 'event');
  let resposta: Response;
  try {
    resposta = await fetch(url, {
      // A API recusa o User-Agent padrão do Node; identificar explicitamente o consumidor.
      headers: { Authorization: credencial, Accept: 'application/json', 'User-Agent': 'ADAI-Hub/1.0', Channel: 'control_panel' },
      cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(8000),
    });
  } catch (error) {
    const timeout = error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');
    throw new InchurchError(timeout ? 'timeout' : 'rede', ENDPOINT);
  }
  // Não ler nem propagar mensagens de autenticação ou conteúdo interno do corpo de erro.
  if (!resposta.ok) throw new InchurchError(resposta.status === 429 ? 'limite' : 'http', ENDPOINT, resposta.status);
  const json = await resposta.json().catch(() => null) as InchurchEventoAdministrativo | null;
  if (!json || Array.isArray(json) || json.id !== id) throw new InchurchError('resposta', ENDPOINT);
  // Compartilhar somente campos utilizados: nunca guardar o objeto administrativo completo.
  const selecionar = <T extends object>(valor: T, chaves: readonly (keyof T)[]): Partial<T> => Object.fromEntries(chaves.map((chave) => [chave, valor[chave]])) as Partial<T>;
  const nome = (valor: string | { name?: string | null } | null | undefined) => typeof valor === 'object' && valor !== null ? { name: valor.name } : valor;
  return {
    ...selecionar(json, ['name', 'start_datetime', 'end_datetime', 'active', 'enabled', 'is_active', 'is_enabled', 'recurrence_model', 'description', 'image', 'image_webp', 'event_url']),
    id: json.id,
    tertiarygroup: json.tertiarygroup ? { id: json.tertiarygroup.id, name: json.tertiarygroup.name } : null,
    units: Array.isArray(json.units) ? json.units.filter(Boolean).map((unit) => ({ id: unit.id, name: unit.name, related_obj: unit.related_obj ? { id: unit.related_obj.id, model: unit.related_obj.model, name: unit.related_obj.name } : null })) : null,
    event_schedule: Array.isArray(json.event_schedule) ? json.event_schedule.filter(Boolean).map((item) => selecionar(item, ['id', 'event_date', 'start', 'end', 'title', 'description', 'venue'])) : null,
    event_attractions: Array.isArray(json.event_attractions) ? json.event_attractions.filter(Boolean).map((item) => selecionar(item, ['id', 'name', 'title', 'description', 'photo', 'url'])) : null,
    event_images: Array.isArray(json.event_images) ? json.event_images.filter(Boolean).map((item) => selecionar(item, ['id', 'image', 'image_webp', 'thumbnail', 'app_image', 'on_blacklist'])) : null,
    location: json.location ? {
      ...selecionar(json.location, ['address', 'address_complement', 'address_number', 'neighborhood', 'latitude', 'longitude']),
      city: nome(json.location.city), state: nome(json.location.state), country: nome(json.location.country),
    } : null,
  };
}

const eventoCache = unstable_cache(buscarEventoAdministrativo, ['inchurch', 'evento-administrativo-projecao', 'v2'], { revalidate: 1800, tags: [INCHURCH_CACHE_TAG] });

export async function getEventoAdministrativo(id: number): Promise<InchurchEventoAdministrativo> {
  if (!Number.isSafeInteger(id) || id <= 0) throw new InchurchError('resposta', ENDPOINT);
  return eventoCache(id);
}
