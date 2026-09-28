import type { StrapiSectionPopulate } from '@/lib/strapi/types';

export const perguntasFrequentesPopulate: StrapiSectionPopulate = { populate: { perguntas: true } };
