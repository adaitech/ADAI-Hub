import type { StrapiPopulate } from '@/lib/strapi/types';

export const headerPopulate: StrapiPopulate = {
  populate: { links: true, botoes: true },
};
