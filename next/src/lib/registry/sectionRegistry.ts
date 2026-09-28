import type { ComponentType } from 'react';
import { CarrosselCardsSection, carrosselCardsPopulate } from '@/components/sections/CarrosselCardsSection';
import { HeroSection, heroPopulate } from '@/components/sections/HeroSection';
import { ImagemTextoSection, imagemTextoPopulate } from '@/components/sections/ImagemTextoSection';
import { ProximosEventosSection, proximosEventosPopulate } from '@/components/sections/ProximosEventosSection';
import { SerieAtualSection, serieAtualPopulate } from '@/components/sections/SerieAtualSection';
import type { StrapiSection, StrapiSectionPopulate } from '@/lib/strapi/types';
import type { SectionProps } from '@/types/sections';

export interface SectionRegistryEntry {
  component: ComponentType<SectionProps<StrapiSection>>;
  populate: StrapiSectionPopulate;
}

function defineSection<TData extends StrapiSection>(
  component: ComponentType<SectionProps<TData>>,
  populate: StrapiSectionPopulate,
): SectionRegistryEntry {
  return { component: component as unknown as SectionRegistryEntry['component'], populate };
}

/**
 * Chave = nome técnico do componente no Strapi (`__component`).
 * Nova seção: adicionar aqui + na dynamic zone `sections` de `page` no Strapi + vitrine.
 */
export const sectionRegistry: Record<string, SectionRegistryEntry> = {
  'sections.hero': defineSection(HeroSection, heroPopulate),
  'sections.carrossel-cards': defineSection(CarrosselCardsSection, carrosselCardsPopulate),
  'sections.imagem-texto': defineSection(ImagemTextoSection, imagemTextoPopulate),
  'sections.serie-atual': defineSection(SerieAtualSection, serieAtualPopulate),
  'sections.proximos-eventos': defineSection(ProximosEventosSection, proximosEventosPopulate),
};

export function getSection(key: string): SectionRegistryEntry | null {
  return sectionRegistry[key] ?? null;
}

/** Fragmentos `on` do populate da dynamic zone, montados a partir do registry. */
export function sectionsPopulate(): Record<string, StrapiSectionPopulate> {
  return Object.fromEntries(Object.entries(sectionRegistry).map(([key, entry]) => [key, entry.populate]));
}
