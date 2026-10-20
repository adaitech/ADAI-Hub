import { getSection } from '@/lib/registry/sectionRegistry';
import type { StrapiSection } from '@/lib/strapi/types';
import styles from './SectionRenderer.module.css';
import { HeroSection } from './HeroSection';
import type { HeroData } from './HeroSection/types';

interface SectionRendererProps {
  sections: StrapiSection[];
  apresentacao?: 'padrao' | 'editorial' | 'institucional' | null;
}

/** Renderiza a dynamic zone `sections` da página, na ordem do Strapi. */
export function SectionRenderer({ sections, apresentacao }: SectionRendererProps) {
  const institucional = apresentacao === 'institucional';
  const primeiroConteudo = institucional ? sections.findIndex((section) => section.__component !== 'sections.hero') : 0;
  const conteudo = sections.map((section, index) => {
    if (institucional && section.__component === 'sections.hero') {
      return <HeroSection key={`${section.__component}-${section.id}`} data={section as HeroData} index={index} somenteImagem />;
    }
    const entry = getSection(section.__component);
    if (!entry) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[SectionRenderer] "${section.__component}" não está no sectionRegistry.`);
      }
      return null;
    }
    const Component = entry.component;
    return <Component key={`${section.__component}-${section.id}`} data={section} index={institucional && index === primeiroConteudo ? 0 : index} />;
  });
  if (apresentacao === 'editorial' && sections.length > 0) {
    return <div className={styles.editorial} data-page-layout="editorial">{conteudo}</div>;
  }
  if (institucional && sections.length > 0) {
    return <div className={`${styles.editorial} ${styles.institucional}`} data-page-layout="institucional">{conteudo}</div>;
  }
  return conteudo;
}
