import type { EventoSite, EventosInchurch } from '@/lib/inchurch/eventos';
import type { UnidadeInchurch } from '@/lib/strapi/queries/unidades';

/** JSON cru de `sections.agenda-eventos`: configuração editorial da listagem. */
export interface AgendaEventosData {
  __component: 'sections.agenda-eventos';
  id: number;
  titulo?: string | null;
  mensagem_vazia?: string | null;
}

export interface AgendaEventoCardView {
  id: number;
  titulo: string;
  destaques: string;
  recorrencia: string | null;
  descricao: string | null;
  imagem: EventoSite['imagem'];
  /** ID da unidade confirmado pela busca `church_id` da inChurch; `null` em evento geral. */
  unidadeId: number | null;
  unidadeIds?: number[];
  badge: string | null;
  badges?: string[];
  /** Dia e mês mostrados no lugar da arte quando a inChurch não fornece uma imagem. */
  fallbackData: { dia: string; mes: string } | null;
}

export interface AgendaEventosView {
  titulo: string;
  mensagemVazia: string;
  cards: AgendaEventoCardView[];
  /** Opções reais carregadas do collection type Unidades do Strapi. */
  unidades: UnidadeInchurch[];
}

/** Exemplo da vitrine: CMS + dados normalizados da inChurch + unidades do Strapi. */
export interface AgendaEventosExemplo {
  strapi: AgendaEventosData;
  inchurch: EventosInchurch;
  unidades: UnidadeInchurch[];
  agora: string;
}
