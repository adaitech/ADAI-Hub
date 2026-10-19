import { getSection } from '@/lib/registry/sectionRegistry';
import type { StrapiSection } from '@/lib/strapi/types';

interface SectionRendererProps {
  sections: StrapiSection[];
  /** Posição da primeira seção (padrão 0). Use 1 quando a página já tem o próprio h1 (ex.: topo do curso). */
  indiceInicial?: number;
}

/** Renderiza a dynamic zone `sections` da página, na ordem do Strapi. */
export function SectionRenderer({ sections, indiceInicial = 0 }: SectionRendererProps) {
  return sections.map((section, index) => {
    const entry = getSection(section.__component);
    if (!entry) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[SectionRenderer] "${section.__component}" não está no sectionRegistry.`);
      }
      return null;
    }
    const Component = entry.component;
    return <Component key={`${section.__component}-${section.id}`} data={section} index={indiceInicial + index} />;
  });
}
