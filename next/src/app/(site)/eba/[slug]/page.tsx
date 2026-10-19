import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SectionRenderer } from '@/components/sections/SectionRenderer';
import { buildMetadata } from '@/lib/metadata';
import { caminhoDaPagina, slugDaPaginaEba } from '@/lib/paginas/caminho';
import { getGlobal } from '@/lib/strapi/queries/global';
import { getPageBySlug } from '@/lib/strapi/queries/page';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const slugStrapi = slugDaPaginaEba((await params).slug);
  const [page, global] = slugStrapi ? await Promise.all([getPageBySlug(slugStrapi), getGlobal()]) : [null, null];
  if (!page || !slugStrapi) return { title: 'Página não encontrada | ADAI', robots: { index: false } };
  return buildMetadata(page.seo, global?.seo, caminhoDaPagina(slugStrapi));
}

/** /eba/<slug> → página "eba-<slug>" do Strapi (o catálogo /eba/cursos tem rota própria, que tem precedência). */
export default async function EbaSubPage({ params }: PageProps) {
  const slugStrapi = slugDaPaginaEba((await params).slug);
  if (!slugStrapi) notFound();

  const page = await getPageBySlug(slugStrapi);
  if (!page) notFound();

  return <SectionRenderer sections={page.sections ?? []} />;
}
