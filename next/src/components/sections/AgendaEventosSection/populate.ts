import type { StrapiSectionPopulate } from '@/lib/strapi/types';

/** A seção só tem campos simples; `true` impede que ela seja omitida pela dynamic zone. */
export const agendaEventosPopulate: StrapiSectionPopulate = true;
