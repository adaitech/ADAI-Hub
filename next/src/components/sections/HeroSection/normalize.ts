import { normalizeBotoes } from '@/lib/strapi/links';
import { resolveStrapiMedia } from '@/lib/strapi/media';
import { splitLines } from '@/utils/text';
import type { HeroData, HeroView } from './types';

export const HERO_MAX_LINHAS = 3;
export const HERO_MAX_BOTOES = 2;

/** JSON do Strapi → dados prontos para o Hero. Sem frase principal, o Hero não é exibido. */
export function normalizeHero(data: HeroData): HeroView | null {
  const linhas = splitLines(data.titulo).slice(0, HERO_MAX_LINHAS);
  if (linhas.length === 0) return null;

  return {
    linhas,
    subtitulo: splitLines(data.subtitulo),
    paragrafos: splitLines(data.texto_apoio),
    pretoEBranco: data.preto_e_branco !== false,
    imagem: resolveStrapiMedia(data.imagem),
    botoes: normalizeBotoes(data.botoes).slice(0, HERO_MAX_BOTOES),
  };
}
