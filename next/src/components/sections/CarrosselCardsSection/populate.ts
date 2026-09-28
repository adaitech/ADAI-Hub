import type { StrapiPopulate } from '@/lib/strapi/types';

export const carrosselCardsPopulate: StrapiPopulate = {
  populate: {
    cards: { populate: { imagem: true, botao: true, link: true } },
    link: true,
  },
};
