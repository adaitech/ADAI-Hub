import { formatarDatasDoEvento } from '@/lib/inchurch/datas';
import { igrejasDoEvento, type EventoSite } from '@/lib/inchurch/eventos';
import type { UnidadeInchurch } from '@/lib/strapi/queries/unidades';
import type { AgendaEventoCardView, AgendaEventosData, AgendaEventosView } from './types';

export const TITULO_PADRAO = 'Todos os eventos';
export const MENSAGEM_VAZIA_PADRAO = 'Ainda não há eventos programados.';

const MESES_ABREVIADOS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

function textoOuPadrao(valor: string | null | undefined, padrao: string): string {
  return valor?.trim() || padrao;
}

function fallbackData(iso: string): AgendaEventoCardView['fallbackData'] {
  const mes = Number(iso.slice(5, 7));
  return { dia: iso.slice(8, 10), mes: MESES_ABREVIADOS[mes - 1] ?? '' };
}

/** Campos editoriais incompletos não quebram a página nem removem a agenda. */
export function normalizeAgendaEventosConfig(data: AgendaEventosData): Pick<AgendaEventosView, 'titulo' | 'mensagemVazia'> {
  return {
    titulo: textoOuPadrao(data.titulo, TITULO_PADRAO),
    mensagemVazia: textoOuPadrao(data.mensagem_vazia, MENSAGEM_VAZIA_PADRAO),
  };
}

/** Dados externos já filtrados + nomes das Unidades → view model sem links ou ações. */
export function normalizeAgendaEventos(data: AgendaEventosData, eventos: EventoSite[], unidades: UnidadeInchurch[]): AgendaEventosView {
  const nomesDasUnidades = new Map(unidades.map((unidade) => [unidade.igrejaId, unidade.nome]));
  const cards = eventos.map((evento) => {
    const datas = formatarDatasDoEvento(evento);
    const unidadeIds = igrejasDoEvento(evento);
    const badges = unidadeIds.map((id) => nomesDasUnidades.get(id)).filter((nome): nome is string => Boolean(nome));
    return {
      id: evento.id,
      titulo: evento.nome,
      destaques: datas.destaques,
      recorrencia: datas.extra,
      descricao: evento.descricao,
      imagem: evento.imagem,
      unidadeId: evento.igrejaId,
      unidadeIds,
      badge: badges[0] ?? null,
      badges,
      fallbackData: evento.imagem ? null : fallbackData(evento.ocorrencias[0].inicio),
    };
  });

  return { ...normalizeAgendaEventosConfig(data), cards, unidades };
}
