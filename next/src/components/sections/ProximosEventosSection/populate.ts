import type { StrapiSectionPopulate } from '@/lib/strapi/types';

export const proximosEventosPopulate: StrapiSectionPopulate = {
  populate: { link: true, unidade: true },
};
