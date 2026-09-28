import type { StrapiPopulate } from '@/lib/strapi/types';

export const footerPopulate: StrapiPopulate = {
  populate: { colunas: { populate: { links: true } } },
};
