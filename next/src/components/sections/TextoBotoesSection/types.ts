import type { BotaoView } from '@/lib/strapi/links';
import type { StrapiBotao } from '@/lib/strapi/types';

/** JSON cru de `sections.texto-botoes`. */
export interface TextoBotoesData {
  __component: 'sections.texto-botoes';
  id: number;
  titulo?: string | null;
  texto_apoio?: string | null;
  botoes?: StrapiBotao[] | null;
}

export interface TextoBotoesView {
  titulo: string;
  textoApoio: string | null;
  botoes: BotaoView[];
}
