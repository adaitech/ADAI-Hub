import { normalizeBotoes, normalizeLink } from '@/lib/strapi/links';
import { resolveStrapiMedia } from '@/lib/strapi/media';
import { splitLines } from '@/utils/text';
import type { ImagemTextoData, ImagemTextoView } from './types';

export const IMAGEM_TEXTO_MAX_LISTA = 5;

/** Sem título, a seção não é exibida. Sem foto, o texto ocupa a largura toda. */
export function normalizeImagemTexto(data: ImagemTextoData): ImagemTextoView | null {
  const linhasTitulo = splitLines(data.titulo);
  if (linhasTitulo.length === 0) return null;

  const lista = (data.lista ?? [])
    .map((item) => ({ titulo: item.titulo?.trim() ?? '', texto: item.texto?.trim() || undefined }))
    .filter((item) => item.titulo)
    .slice(0, IMAGEM_TEXTO_MAX_LISTA);

  return {
    imagem: resolveStrapiMedia(data.imagem),
    posicao: data.posicao_imagem === 'direita' ? 'direita' : 'esquerda',
    pretoEBranco: data.preto_e_branco !== false,
    rotulo: data.rotulo?.trim() || undefined,
    linhasTitulo,
    paragrafos: splitLines(data.texto),
    lista,
    botao: normalizeBotoes(data.botao ? [data.botao] : [])[0] ?? null,
    link: normalizeLink(data.link),
  };
}
