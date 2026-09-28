import type { StrapiSectionPopulate } from '@/lib/strapi/types';

export const ministeriosPopulate: StrapiSectionPopulate = { populate: { botao: true, ministerios: true } };
