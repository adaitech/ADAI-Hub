import type { StrapiPopulate } from '@/lib/strapi/types';

export const heroPopulate: StrapiPopulate = {
  populate: { imagem: true, botoes: true },
};
