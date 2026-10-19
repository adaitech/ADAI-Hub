import type { StrapiSectionPopulate } from '@/lib/strapi/types';

/** Só campos simples: `true` faz o Strapi 5 incluir a seção na dynamic zone. */
export const catalogoCursosPopulate: StrapiSectionPopulate = true;
