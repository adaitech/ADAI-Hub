import { getSection } from '@/lib/registry/sectionRegistry';
import type { StrapiSection } from '@/lib/strapi/types';
import styles from './SectionRenderer.module.css';

interface SectionRendererProps {
  sections: StrapiSection[];
  apresentacao?: 'padrao' | 'editorial' | null;
}

/** Renderiza a dynamic zone `sections` da página, na ordem do Strapi. */
export function SectionRenderer({ sections, apresentacao }: SectionRendererProps) {
  const conteudo = sections.map((section, index) => {
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
  if (apresentacao === 'editorial' && sections.length > 0) {
    return <div className={styles.editorial} data-page-layout="editorial">{conteudo}</div>;
  }
  return conteudo;
}
