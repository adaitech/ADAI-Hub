import type { Metadata } from 'next';
import { slugDaPaginaEba } from '@/lib/paginas/caminho';
import { metadataDaPaginaEba, paginaEba } from '../pagina-eba';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return metadataDaPaginaEba(slugDaPaginaEba((await params).slug));
}

/**
 * /eba/<slug> → página "eba-<slug>" do Strapi. Rotas estáticas irmãs têm precedência:
 * /eba/cursos (catálogo) e /eba/testes (que também tem /eba/testes/[slug]).
 * Trilha ADAI › EBA › <título da página no Strapi>, com BreadcrumbList.
 */
export default async function EbaSubPage({ params }: PageProps) {
  return paginaEba(slugDaPaginaEba((await params).slug));
}
