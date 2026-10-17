import type { Metadata } from 'next';
import { configuracaoSeo } from '@/lib/seo/site';
import { sanitizeHref } from '@/lib/strapi/links';
import type { UnidadeInchurch } from '@/lib/strapi/queries/unidades';
import { idIgrejaValido, normalizeEventos, paraIsoSaoPaulo, type EventoSite } from './eventos';
import type { ConvidadoEvento, FotoEvento, InchurchAtividade, InchurchConvidado, InchurchImagemEvento, InchurchEvento, InchurchEventoAdministrativo, ProgramacaoDia } from './types';

export function urlDoEvento(evento: Pick<EventoSite, 'id' | 'nome'>): string {
  const nome = evento.nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `/agenda/${nome || 'evento'}-${evento.id}`;
}

export function idDoSlug(slug: string): number | null {
  const id = Number(slug.match(/-(\d+)$/)?.[1]);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/** HTML nunca é inserido no DOM. Mantém parágrafos e decodifica entidades como texto. */
export function textoDaDescricao(html: string | null | undefined): string {
  const entidades: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return (html ?? '')
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n').replace(/<\/(?:p|div|li|h[1-6])\s*>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (original, entidade: string) => {
      if (!entidade.startsWith('#')) return entidades[entidade.toLowerCase()] ?? original;
      const valor = entidade[1].toLowerCase() === 'x' ? parseInt(entidade.slice(2), 16) : Number(entidade.slice(1));
      return valor > 0 && valor <= 0x10ffff ? String.fromCodePoint(valor) : '';
    }).replace(/\n[ \t]+/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

function urlHttp(valor: string | null | undefined): string | null {
  const url = sanitizeHref(valor);
  if (!url || !/^https?:\/\//i.test(url)) return null;
  try { return new URL(url).hostname ? url : null; } catch { return null; }
}

/** Texto seguro continua sendo texto do React; somente URLs HTTP(S) viram links. */
export function partesDaDescricao(texto: string): { texto: string; url: string | null }[] {
  return texto.split(/(https?:\/\/[^\s<>"']+)/gi).flatMap((parte) => {
    if (!/^https?:\/\//i.test(parte)) return [{ texto: parte, url: null }];
    let destino = parte.replace(/[.,;:!?]+$/g, '');
    const aberturas: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
    while (aberturas[destino.at(-1)!]) {
      const fim = destino.at(-1)!;
      const contar = (char: string) => [...destino].filter((c) => c === char).length;
      if (contar(fim) <= contar(aberturas[fim])) break;
      destino = destino.slice(0, -1);
    }
    const url = urlHttp(destino);
    return url ? [{ texto: destino, url }, { texto: parte.slice(destino.length), url: null }] : [{ texto: parte, url: null }];
  });
}

function localizacaoDoEvento(local: InchurchEvento['location']) {
  if (!local) return null;
  const juntar = (valores: (string | null | undefined)[], separador: string) => valores.map((v) => v?.trim()).filter(Boolean).join(separador);
  const linhas = [
    local.address_complement?.trim(),
    juntar([local.address, local.address_number], ', '),
    local.neighborhood?.trim(),
    juntar([local.city, local.state], ' - '),
  ].filter((linha): linha is string => Boolean(linha));
  const coordenadasValidas = typeof local.latitude === 'number' && Number.isFinite(local.latitude) && Math.abs(local.latitude) <= 90
    && typeof local.longitude === 'number' && Number.isFinite(local.longitude) && Math.abs(local.longitude) <= 180;
  const query = coordenadasValidas ? `${local.latitude},${local.longitude}` : linhas.join(', ');
  if (!query) return null;
  return { linhas, urlMapa: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` };
}

export function normalizeDetalhe(evento: InchurchEvento, unidade: UnidadeInchurch | null = null) {
  const igrejaPorEvento = unidade ? new Map([[evento.id, unidade.igrejaId]]) : undefined;
  const base = normalizeEventos([evento], new Set(), undefined, igrejaPorEvento).eventos[0];
  if (!base) return null;
  const urlEvento = urlHttp(evento.event_url);
  return {
    ...base,
    descricaoCompleta: textoDaDescricao(evento.description),
    fim: paraIsoSaoPaulo(evento.end_datetime),
    unidade: unidade?.nome.trim() || evento.responsible_church?.name?.trim() || null,
    unidades: base.igrejaId ? [{ igrejaId: base.igrejaId, nome: unidade?.nome.trim() || evento.responsible_church?.name?.trim() || '' }].filter((u) => u.nome) : [],
    programacao: [] as ProgramacaoDia[],
    convidados: [] as ConvidadoEvento[],
    galeria: [] as FotoEvento[],
    local: evento.location ?? null,
    localizacao: localizacaoDoEvento(evento.location),
    cta: urlEvento ? { url: urlEvento, texto: 'Acessar evento' } : null,
  };
}

export type EventoDetalhe = NonNullable<ReturnType<typeof normalizeDetalhe>>;

export function normalizarGaleria(imagens: InchurchImagemEvento[] | null | undefined): FotoEvento[] {
  const ids = new Set<number>();
  const url = (valor: unknown) => typeof valor === 'string' ? urlHttp(valor) : null;
  return (Array.isArray(imagens) ? imagens : []).flatMap((foto) => {
    if (!foto || !Number.isSafeInteger(foto.id) || !foto.id || foto.id < 0 || foto.on_blacklist === true || ids.has(foto.id)) return [];
    const imagem = url(foto.image_webp) || url(foto.image) || url(foto.app_image) || url(foto.thumbnail);
    if (!imagem) return [];
    ids.add(foto.id);
    // thumbnail da inChurch pode ter só 180px; Next/Image gera a versão do grid a partir da fonte maior.
    return [{ id: foto.id, imagem, miniatura: imagem }];
  });
}

/** Projeta apenas os campos exibidos; conteúdo HTML continua sendo texto seguro. */
export function normalizarConvidados(convidados: InchurchConvidado[] | null | undefined): ConvidadoEvento[] {
  const texto = (valor: unknown) => typeof valor === 'string' ? textoDaDescricao(valor) : '';
  return (Array.isArray(convidados) ? convidados : []).flatMap((convidado) => {
    const nome = texto(convidado?.name);
    if (!nome) return [];
    return [{ nome, cargo: texto(convidado.title), biografia: texto(convidado.description),
      foto: typeof convidado.photo === 'string' ? urlHttp(convidado.photo) : null,
      url: typeof convidado.url === 'string' ? urlHttp(convidado.url) : null }];
  });
}

/** IDs de Unit são internos: só related_obj do modelo de igreja local identifica o campus. */
export function normalizarUnidadesAdministrativas(admin: Pick<InchurchEventoAdministrativo, 'units' | 'tertiarygroup'>, cadastro: readonly UnidadeInchurch[]): UnidadeInchurch[] {
  const unidades = new Map<number, UnidadeInchurch>();
  const adicionar = (id: unknown, nome: string | null | undefined) => {
    const igrejaId = idIgrejaValido(id);
    if (!igrejaId) return;
    const nomeSeguro = textoDaDescricao(cadastro.find((u) => u.igrejaId === igrejaId)?.nome || nome);
    if (nomeSeguro) unidades.set(igrejaId, { igrejaId, nome: nomeSeguro });
  };
  for (const unit of Array.isArray(admin.units) ? admin.units : []) {
    if (unit.related_obj?.model === 'inradartertiarygroup') adicionar(unit.related_obj.id, unit.related_obj.name || unit.name);
  }
  // Uma publicação explicitamente regional/denominacional não vira uma igreja por inferência.
  if (!admin.units?.length) adicionar(admin.tertiarygroup?.id, admin.tertiarygroup?.name);
  return [...unidades.values()];
}

export function normalizarProgramacao(atividades: InchurchAtividade[] | null | undefined): ProgramacaoDia[] {
  const dias = new Map<string, ProgramacaoDia>();
  const horario = (valor: string | null | undefined) => typeof valor === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?$/.test(valor) ? valor.slice(0, 5) : null;
  for (const item of Array.isArray(atividades) ? atividades : []) {
    const data = item.event_date?.slice(0, 10) ?? '';
    const instante = /^\d{4}-\d{2}-\d{2}$/.test(data) ? Date.parse(`${data}T12:00:00Z`) : NaN;
    const inicio = horario(item.start);
    const titulo = textoDaDescricao(item.title);
    if (!Number.isFinite(instante) || new Date(instante).toISOString().slice(0, 10) !== data || !inicio || !titulo) continue;
    const dia = dias.get(data) ?? { data, atividades: [] };
    dia.atividades.push({ inicio, fim: horario(item.end), titulo, descricao: textoDaDescricao(item.description), local: textoDaDescricao(item.venue) });
    dias.set(data, dia);
  }
  return [...dias.values()].sort((a, b) => a.data.localeCompare(b.data)).map((dia) => ({ ...dia, atividades: dia.atividades.sort((a, b) => a.inicio.localeCompare(b.inicio)) }));
}

/** Recebe um detalhe público já aprovado; projeta somente conteúdo usado na página. */
export function normalizeDetalheAdministrativo(admin: InchurchEventoAdministrativo, publico: EventoDetalhe, cadastro: readonly UnidadeInchurch[]): EventoDetalhe | null {
  // is_public administrativo não é o contrato de publicação do site: a API pública já validou o evento.
  if (admin.id !== publico.id || [admin.is_enabled, admin.enabled, admin.is_active, admin.active].some((valor) => valor !== undefined && valor !== true)
    || admin.recurrence_model === true) return null;
  const unidadesAdmin = normalizarUnidadesAdministrativas(admin, cadastro);
  const unidades = !admin.units?.length && !admin.tertiarygroup && unidadesAdmin.length === 0 ? publico.unidades : unidadesAdmin;
  const nomeLocal = (valor: string | { name?: string | null } | null | undefined) => typeof valor === 'string' ? valor : valor?.name;
  const local = publico.local || admin.location ? {
    address_complement: admin.location?.address_complement || publico.local?.address_complement,
    address: admin.location?.address || publico.local?.address,
    address_number: admin.location?.address_number != null ? String(admin.location.address_number) : publico.local?.address_number,
    neighborhood: admin.location?.neighborhood || publico.local?.neighborhood,
    city: nomeLocal(admin.location?.city) || publico.local?.city,
    state: nomeLocal(admin.location?.state) || publico.local?.state,
    country: nomeLocal(admin.location?.country) || publico.local?.country,
    latitude: admin.location?.latitude ?? publico.local?.latitude,
    longitude: admin.location?.longitude ?? publico.local?.longitude,
  } : null;
  // A publicação já foi validada na API pública. Nunca espalhar o objeto administrativo.
  const detalhe = normalizeDetalhe({
    id: publico.id, name: admin.name || publico.nome,
    start_datetime: admin.start_datetime || publico.ocorrencias[0].inicio,
    end_datetime: admin.end_datetime || publico.fim,
    description: admin.description ?? publico.descricaoCompleta,
    image: admin.image || publico.imagem?.url, image_webp: admin.image_webp,
    event_url: admin.event_url ?? publico.cta?.url, location: local,
    active: true, enabled: true,
  });
  if (!detalhe) return null;
  return { ...detalhe, unidades, unidade: unidades.map((u) => u.nome).join(', ') || null,
    igrejaId: unidades.length === 1 ? unidades[0].igrejaId : null, igrejaIds: unidades.map((u) => u.igrejaId), programacao: normalizarProgramacao(admin.event_schedule),
    convidados: normalizarConvidados(admin.event_attractions), galeria: normalizarGaleria(admin.event_images) };
}

export function metadataDoEvento(evento: EventoDetalhe): Metadata {
  const title = `${evento.nome} | ADAI`;
  const description = evento.descricaoCompleta.replace(/\s+/g, ' ').slice(0, 160) || undefined;
  const base = configuracaoSeo().url;
  const canonical = base ? `${base}${urlDoEvento(evento)}` : urlDoEvento(evento);
  return {
    title: { absolute: title }, description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, images: evento.imagem ? [{ url: evento.imagem.url }] : [] },
  };
}

export function schemaDoEvento(evento: EventoDetalhe) {
  const local = evento.local;
  // Um Event indexável precisa de início e localização reais.
  if (!local?.address || !local.city) return null;
  return {
    '@context': 'https://schema.org', '@type': 'Event', name: evento.nome,
    startDate: evento.ocorrencias[0].inicio,
    ...(evento.fim ? { endDate: evento.fim } : {}),
    ...(evento.descricaoCompleta ? { description: evento.descricaoCompleta } : {}),
    ...(evento.imagem ? { image: evento.imagem.url } : {}),
    location: { '@type': 'Place', address: {
      '@type': 'PostalAddress', streetAddress: [local.address, local.address_number].filter(Boolean).join(', '),
      addressLocality: local.city, addressRegion: local.state || undefined, addressCountry: local.country || undefined,
    } },
  };
}
