import type { CorCard } from '@/components/sections/CarrosselCardsSection/types';
import type { EventosInchurch } from '@/lib/inchurch/eventos';
import type { StrapiLink } from '@/lib/strapi/types';

/** JSON cru de `sections.proximos-eventos`: só apresentação. Os eventos vêm da inChurch. */
export interface ProximosEventosData {
  __component: 'sections.proximos-eventos';
  id: number;
  titulo?: string | null;
  texto_apoio?: string | null;
  /** 1 a 12 (padrão 8). */
  quantidade?: number | null;
  cor_cards?: CorCard | null;
  link?: StrapiLink | null;
  /** Unidade (tipo Unidades do Strapi): filtra a agenda para os eventos dela + os gerais. Vazio = todos. */
  unidade?: { id: number; nome?: string | null; igreja_inchurch_id?: number | null } | null;
}

/** Exemplo da vitrine: configuração do Strapi + eventos normalizados da inChurch + "agora". */
export interface ProximosEventosExemplo {
  strapi: ProximosEventosData;
  inchurch: EventosInchurch;
  agora: string;
}
