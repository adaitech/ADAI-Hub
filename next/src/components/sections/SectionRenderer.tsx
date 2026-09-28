import { getSection } from '@/lib/registry/sectionRegistry';
import type { StrapiSection } from '@/lib/strapi/types';

interface SectionRendererProps {
  sections: StrapiSection[];
}

/** Renderiza a dynamic zone `sections` da página, na ordem do Strapi. */
export function SectionRenderer({ sections }: SectionRendererProps) {
  return sections.map((section, index) => {
    const entry = getSection(section.__component);
    if (!entry) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[SectionRenderer] "${section.__component}" não está no sectionRegistry.`);
      }
      return null;
    }
    const Component = entry.component;
    return <Component key={`${section.__component}-${section.id}`} data={section} index={index} />;
  });
}
