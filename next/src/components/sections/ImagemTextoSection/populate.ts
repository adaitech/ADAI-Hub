import type { StrapiPopulate } from '@/lib/strapi/types';

export const imagemTextoPopulate: StrapiPopulate = {
  populate: { imagem: true, lista: true, botao: true, link: true },
};
