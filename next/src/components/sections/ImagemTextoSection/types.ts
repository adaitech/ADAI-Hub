import type { BotaoView, LinkView } from '@/lib/strapi/links';
import type { MediaView } from '@/lib/strapi/media';
import type { StrapiBotao, StrapiLink, StrapiMedia } from '@/lib/strapi/types';

/** `items.destaque` */
export interface DestaqueData {
  id: number;
  titulo?: string | null;
  texto?: string | null;
}

/** JSON cru de `sections.imagem-texto`. */
export interface ImagemTextoData {
  __component: 'sections.imagem-texto';
  id: number;
  imagem?: StrapiMedia | null;
  posicao_imagem?: 'esquerda' | 'direita' | null;
  /** Padrão true (identidade P&B); false mostra a foto colorida. */
  preto_e_branco?: boolean | null;
  rotulo?: string | null;
  /** Quebras de linha por "\n". */
  titulo?: string | null;
  /** Parágrafos por "\n". */
  texto?: string | null;
  lista?: DestaqueData[] | null;
  botao?: StrapiBotao | null;
  botoes_secundarios?: StrapiBotao[] | null;
  link?: StrapiLink | null;
}

export interface ImagemTextoView {
  imagem: MediaView | null;
  posicao: 'esquerda' | 'direita';
  pretoEBranco: boolean;
  rotulo?: string;
  linhasTitulo: string[];
  paragrafos: string[];
  lista: { titulo: string; texto?: string }[];
  botao: BotaoView | null;
  botoesSecundarios: BotaoView[];
  link: LinkView | null;
}
