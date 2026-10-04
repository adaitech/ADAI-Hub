import type { BotaoView } from '@/lib/strapi/links';
import type { MediaView } from '@/lib/strapi/media';
import type { StrapiBotao, StrapiMedia } from '@/lib/strapi/types';

/** JSON cru de `sections.hero` como a API do Strapi 5 entrega. */
export interface HeroData {
  __component: 'sections.hero';
  id: number;
  /** Uma frase por linha (separadas por "\n"). */
  titulo?: string | null;
  /** Parágrafos separados por "\n". */
  texto_apoio?: string | null;
  imagem?: StrapiMedia | null;
  botoes?: StrapiBotao[] | null;
  /** Texto abaixo da frase principal, à esquerda (ex.: apresentação da unidade). Linhas por "
". */
  subtitulo?: string | null;
  /** Foto em preto e branco (padrão). `false` = colorida (páginas das unidades). */
  preto_e_branco?: boolean | null;
}

export interface HeroView {
  linhas: string[];
  subtitulo: string[];
  paragrafos: string[];
  pretoEBranco: boolean;
  imagem: MediaView | null;
  botoes: BotaoView[];
}
