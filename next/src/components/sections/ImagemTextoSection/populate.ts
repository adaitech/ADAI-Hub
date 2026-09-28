import type { StrapiPopulate } from '@/lib/strapi/types';

export const imagemTextoPopulate: StrapiPopulate = {
  populate: { imagem: true, lista: true, botao: true, botoes_secundarios: true, link: true },
};
