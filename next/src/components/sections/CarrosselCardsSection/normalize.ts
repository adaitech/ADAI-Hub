import { normalizeBotoes, normalizeLink, sanitizeHref } from '@/lib/strapi/links';
import { resolveStrapiMedia } from '@/lib/strapi/media';
import { splitLines } from '@/utils/text';
import { CORES_CARD, type CardData, type CardView, type CarrosselCardsData, type CarrosselCardsView, type CorCard } from './types';

export const CARROSSEL_MAX_CARDS = 12;
export const CARD_MAX_DESTAQUES = 4;

const CORES_CLARAS: CorCard[] = ['cinza', 'branco'];

function normalizeCard(card: CardData): CardView | null {
  const titulo = card.titulo?.trim();
  if (!titulo) return null;

  const cor: CorCard = card.cor && CORES_CARD.includes(card.cor) ? card.cor : 'cinza';

  return {
    id: card.id,
    cor,
    superficie: CORES_CLARAS.includes(cor) ? 'clara' : 'escura',
    titulo,
    imagem: resolveStrapiMedia(card.imagem),
    destaques: splitLines(card.destaques).slice(0, CARD_MAX_DESTAQUES),
    texto: splitLines(card.texto),
    botao: normalizeBotoes(card.botao ? [card.botao] : [])[0] ?? null,
    link: normalizeLink(card.link),
    href: sanitizeHref(card.url),
  };
}

/** Sem título ou sem nenhum card válido, a seção não é exibida. */
export function normalizeCarrosselCards(data: CarrosselCardsData): CarrosselCardsView | null {
  const titulo = data.titulo?.trim();
  const cards = (data.cards ?? [])
    .map(normalizeCard)
    .filter((card): card is CardView => card !== null)
    .slice(0, CARROSSEL_MAX_CARDS);
  if (!titulo || cards.length === 0) return null;

  return {
    titulo,
    textoApoio: data.texto_apoio?.trim() || undefined,
    cards,
    link: normalizeLink(data.link),
    temImagem: cards.some((card) => card.imagem !== null),
    posicaoImagem: data.posicao_imagem === 'abaixo' || data.posicao_imagem === 'apos_titulo' ? data.posicao_imagem : 'acima',
    pretoEBranco: data.preto_e_branco !== false,
    estiloImagem: data.estilo_imagem === 'arte' ? 'arte' : 'foto',
  };
}
