import type { BotaoView } from '@/lib/strapi/links';
import type { StrapiBotao } from '@/lib/strapi/types';

export interface MinisterioData {
  id: number;
  nome?: string | null;
  publico?: string | null;
  url?: string | null;
}

/** JSON de `sections.ministerios`: lista editorial, sem carrossel. */
export interface MinisteriosData {
  __component: 'sections.ministerios';
  id: number;
  titulo?: string | null;
  texto_apoio?: string | null;
  botao?: StrapiBotao | null;
  ministerios?: MinisterioData[] | null;
  /** `lista` (Home: linhas ao lado do convite) ou `cards` (unidades: grade de cards cinza). */
  exibicao?: 'lista' | 'cards' | null;
}

export interface MinisteriosView {
  titulo: string;
  textoApoio: string | null;
  botao: BotaoView | null;
  ministerios: { id: number; nome: string; publico: string | null; href: string | null }[];
  exibicao: 'lista' | 'cards';
}
