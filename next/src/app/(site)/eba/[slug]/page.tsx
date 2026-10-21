import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SectionRenderer } from '@/components/sections/SectionRenderer';
import { Trilha, type TrilhaItem } from '@/components/ui/Trilha';
import { schemaDaTrilha } from '@/lib/eba/dados-estruturados';
import { buildMetadata } from '@/lib/metadata';
import { caminhoDaPagina, slugDaPaginaEba } from '@/lib/paginas/caminho';
import { jsonLdSeguro, origemDoSite } from '@/lib/seo/json-ld';
import { getGlobal } from '@/lib/strapi/queries/global';
import { getPageBySlug } from '@/lib/strapi/queries/page';
import styles from '../eba.module.css';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const slugStrapi = slugDaPaginaEba((await params).slug);
  const [page, global] = slugStrapi ? await Promise.all([getPageBySlug(slugStrapi), getGlobal()]) : [null, null];
  if (!page || !slugStrapi) return { title: 'Página não encontrada | ADAI', robots: { index: false } };
  return buildMetadata(page.seo, global?.seo, caminhoDaPagina(slugStrapi));
}

/**
 * /eba/<slug> → página "eba-<slug>" do Strapi (o catálogo /eba/cursos tem rota própria, que tem precedência).
 * Trilha ADAI › EBA › <título da página no Strapi>, com BreadcrumbList.
 */
export default async function EbaSubPage({ params }: PageProps) {
  const slugStrapi = slugDaPaginaEba((await params).slug);
  if (!slugStrapi) notFound();

  const page = await getPageBySlug(slugStrapi);
  if (!page) notFound();

  const trilha: TrilhaItem[] = [{ texto: 'ADAI', href: '/' }, { texto: 'EBA', href: '/eba' }, { texto: page.titulo }];
  return (
    <>
      <script type="application/ld+json">{jsonLdSeguro(schemaDaTrilha(trilha, origemDoSite()))}</script>
      <div className={styles.trilha}>
        <Trilha itens={trilha} />
      </div>
      <SectionRenderer sections={page.sections ?? []} />
    </>
  );
}
