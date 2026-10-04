import { sanitizeHref } from '@/lib/strapi/links';
import type { InchurchEvento } from './types';

/**
 * Regras dos eventos do site (sem rede, sem React). Validadas com a API real e com a tela
 * "Próximos Eventos" do painel da inChurch (27/09/2026):
 * - só `active && enabled && show_on_site` ("mostrar no site" no painel manda);
 * - GCs (Grupos de Conexão) nunca aparecem: categoria "Grupo de Conexão" ou nome "GC …";
 * - `recurrence_model` é o modelo da recorrência, não uma data: ignorado;
 * - mesmo nome + mesmo início = cópia (ex.: evento recriado): uma só;
 * - evento recorrente (mesmo nome, várias datas) vira um item com todas as datas.
 */

/** Categoria "Grupo de Conexão" na inChurch da ADAI (`GET /v1/event_categories/`). */
export const CATEGORIA_GRUPO_DE_CONEXAO = 8776;

export interface OcorrenciaEvento {
  /** ISO com fuso de São Paulo (`2026-10-14T20:00:00-03:00`). */
  inicio: string;
  fim: string;
}

export interface EventoSite {
  id: number;
  nome: string;
  /** Datas em ordem cronológica (recorrência = várias). */
  ocorrencias: OcorrenciaEvento[];
  imagem: { url: string; width: number; height: number } | null;
  descricao: string | null;
  /** Inscrição externa ou link online (Zoom aberto). Sem link público conhecido → null. */
  link: { url: string; texto: string } | null;
  destaque: boolean;
  /** Igreja (unidade) da inChurch em que o evento foi cadastrado; `null` = evento geral da ADAI. */
  igrejaId: number | null;
}

/** Resultado que vai para o cache (não depende de "agora"). */
export interface EventosInchurch {
  eventos: EventoSite[];
  atualizadoEm: string;
}

/** A API manda data sem fuso (horário da igreja). O Brasil não tem horário de verão desde 2019. */
export function paraIsoSaoPaulo(data: string | null | undefined): string | null {
  const texto = data?.trim();
  if (!texto || Number.isNaN(new Date(texto).getTime())) return null;
  return /(?:Z|[+-]\d{2}:?\d{2})$/.test(texto) ? texto : `${texto.slice(0, 19)}-03:00`;
}

/** ID de igreja da inChurch: inteiro positivo; qualquer outra coisa → null. */
export function idIgrejaValido(valor: unknown): number | null {
  return typeof valor === 'number' && Number.isInteger(valor) && valor > 0 ? valor : null;
}

export function ehGrupoDeConexao(evento: InchurchEvento, idsCategoriaGc: ReadonlySet<number>): boolean {
  return idsCategoriaGc.has(evento.id) || /^\s*GC\b/i.test(evento.name ?? '');
}

function apareceNoSite(evento: InchurchEvento): boolean {
  return evento.active === true && evento.enabled === true && evento.show_on_site === true && evento.recurrence_model !== true;
}

/** Primeiro parágrafo, até ~140 caracteres, sem cortar palavra. */
function resumo(descricao: string | null | undefined): string | null {
  const primeiro = descricao?.split(/\n\s*\n|\n/).map((p) => p.trim()).find(Boolean);
  if (!primeiro) return null;
  if (primeiro.length <= 140) return primeiro;
  return `${primeiro.slice(0, 140).replace(/\s+\S*$/, '')}…`;
}

function linkDoEvento(evento: InchurchEvento): EventoSite['link'] {
  const inscricao = evento.has_external_subscription ? sanitizeHref(evento.external_subscription_url) : null;
  if (inscricao && /^https?:/i.test(inscricao)) return { url: inscricao, texto: 'Inscreva-se' };
  const online = sanitizeHref(evento.event_url);
  if (online && /^https?:/i.test(online)) return { url: online, texto: 'Participar online' };
  return null;
}

const chaveNome = (nome: string) => nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

/**
 * Lista crua da API → eventos do site (um item por evento, com todas as datas).
 * `igrejaPorEvento`: id do evento → igreja da inChurch (vem das buscas por `church_id`;
 * o JSON do evento não traz a igreja). O agrupamento é por nome **e** igreja: "Batismo" do
 * Campestre e "Batismo" de Santos são cards separados (cada um aparece na sua unidade).
 */
export function normalizeEventos(
  eventos: InchurchEvento[],
  idsCategoriaGc: ReadonlySet<number>,
  agora = new Date(),
  igrejaPorEvento: ReadonlyMap<number, number> = new Map(),
): EventosInchurch {
  const porNome = new Map<string, { base: InchurchEvento; ocorrencias: Map<string, OcorrenciaEvento>; igrejaId: number | null }>();

  for (const evento of eventos) {
    const nome = evento.name?.trim();
    const inicio = paraIsoSaoPaulo(evento.start_datetime);
    if (!nome || !inicio || !apareceNoSite(evento) || ehGrupoDeConexao(evento, idsCategoriaGc)) continue;
    const fim = paraIsoSaoPaulo(evento.end_datetime) ?? inicio;

    const igrejaId = igrejaPorEvento.get(evento.id) ?? null;
    const chave = `${chaveNome(nome)}|${igrejaId ?? 'geral'}`;
    const grupo = porNome.get(chave) ?? { base: evento, ocorrencias: new Map(), igrejaId };
    grupo.ocorrencias.set(inicio, { inicio, fim }); // mesma data = cópia
    if (!grupo.base.image && !grupo.base.image_webp && (evento.image || evento.image_webp)) grupo.base = evento;
    porNome.set(chave, grupo);
  }

  const lista: EventoSite[] = [...porNome.values()].map(({ base, ocorrencias, igrejaId }) => {
    const url = base.image_webp?.trim() || base.image?.trim();
    return {
      id: base.id,
      nome: base.name!.trim(),
      ocorrencias: [...ocorrencias.values()].sort((a, b) => a.inicio.localeCompare(b.inicio)),
      // A inChurch gera as artes em 1280×720 (16:9).
      imagem: url && /^https:\/\//.test(url) ? { url, width: 1280, height: 720 } : null,
      descricao: resumo(base.description),
      link: linkDoEvento(base),
      destaque: base.highlighted === true,
      igrejaId,
    };
  });

  return {
    eventos: lista.sort((a, b) => a.ocorrencias[0].inicio.localeCompare(b.ocorrencias[0].inicio)),
    atualizadoEm: agora.toISOString(),
  };
}

/**
 * Aplica "agora" ao resultado cacheado: tira datas que já acabaram, some com eventos sem
 * data futura e limita a quantidade. Destaques do painel vêm primeiro.
 * Com `igrejaId` (página de unidade): eventos dessa igreja + gerais; os de outras igrejas saem.
 */
export function proximosEventos(
  dados: EventosInchurch,
  { agora = new Date(), limite = 8, igrejaId = null }: { agora?: Date; limite?: number; igrejaId?: number | null } = {},
): EventoSite[] {
  const t = agora.getTime();
  return dados.eventos
    .filter((evento) => igrejaId === null || evento.igrejaId === null || evento.igrejaId === igrejaId)
    .map((evento) => ({ ...evento, ocorrencias: evento.ocorrencias.filter((o) => new Date(o.fim).getTime() >= t) }))
    .filter((evento) => evento.ocorrencias.length > 0)
    .sort((a, b) => Number(b.destaque) - Number(a.destaque) || a.ocorrencias[0].inicio.localeCompare(b.ocorrencias[0].inicio))
    .slice(0, Math.max(1, limite));
}
