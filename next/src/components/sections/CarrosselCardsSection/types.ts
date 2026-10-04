import type { BotaoView, LinkView } from '@/lib/strapi/links';
import type { MediaView } from '@/lib/strapi/media';
import type { StrapiBotao, StrapiLink, StrapiMedia } from '@/lib/strapi/types';

export const CORES_CARD = ['cinza', 'branco', 'preto', 'azul', 'verde', 'laranja', 'vinho'] as const;
export type CorCard = (typeof CORES_CARD)[number];

/** `items.card` */
export interface CardData {
  id: number;
  cor?: CorCard | null;
  imagem?: StrapiMedia | null;
  titulo?: string | null;
  /** Um destaque por linha (ex.: horários). */
  destaques?: string | null;
  /** Linhas separadas por "\n" (ex.: endereço). */
  texto?: string | null;
  botao?: StrapiBotao | null;
  link?: StrapiLink | null;
  /** Página que abre ao clicar em qualquer parte do card (ex.: /campestre). */
  url?: string | null;
}

/** JSON cru de `sections.carrossel-cards`. */
export interface CarrosselCardsData {
  __component: 'sections.carrossel-cards';
  id: number;
  titulo?: string | null;
  texto_apoio?: string | null;
  cards?: CardData[] | null;
  /** `foto` = 3:2 em preto e branco (padrão); `arte` = arte de divulgação 16:9 colorida (ex.: eventos). */
  estilo_imagem?: 'foto' | 'arte' | null;
  /** Foto acima do título (padrão), logo após o título ou abaixo das ações, em todos os cards. */
  posicao_imagem?: 'acima' | 'apos_titulo' | 'abaixo' | null;
  /** Fotos em preto e branco (padrão). `false` = coloridas. A arte (`estilo_imagem: arte`) é sempre colorida. */
  preto_e_branco?: boolean | null;
  link?: StrapiLink | null;
}

export interface CardView {
  id: number;
  cor: CorCard;
  /** Fundo claro (cinza, branco) ou escuro (preto e cores): define texto e botões. */
  superficie: 'clara' | 'escura';
  titulo: string;
  imagem: MediaView | null;
  destaques: string[];
  texto: string[];
  botao: BotaoView | null;
  link: LinkView | null;
  /** Destino do card inteiro (título vira link esticado); `null` = card sem link próprio. */
  href: string | null;
}

export interface CarrosselCardsView {
  titulo: string;
  textoApoio?: string;
  cards: CardView[];
  link: LinkView | null;
  /** Algum card tem foto: a grade reserva a linha da foto em todos para manter o alinhamento. */
  temImagem: boolean;
  posicaoImagem: 'acima' | 'apos_titulo' | 'abaixo';
  pretoEBranco: boolean;
  estiloImagem: 'foto' | 'arte';
}
