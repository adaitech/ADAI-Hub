import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SectionRenderer } from '@/components/sections/SectionRenderer';
import { buildMetadata } from '@/lib/metadata';
import { caminhoDaPagina, slugDaPaginaSobreNos } from '@/lib/paginas/caminho';
import { getGlobal } from '@/lib/strapi/queries/global';
import { getPageBySlug } from '@/lib/strapi/queries/page';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const slugStrapi = slugDaPaginaSobreNos((await params).slug);
  const [page, global] = slugStrapi ? await Promise.all([getPageBySlug(slugStrapi), getGlobal()]) : [null, null];
  if (!page || !slugStrapi) return { title: 'Página não encontrada | ADAI', robots: { index: false } };
  return buildMetadata(page.seo, global?.seo, caminhoDaPagina(slugStrapi));
}

/** /sobre-nos/<slug> → página "sobre-nos-<slug>" do Strapi (ex.: Nossa história). */
export default async function SobreNosPage({ params }: PageProps) {
  const slugStrapi = slugDaPaginaSobreNos((await params).slug);
  if (!slugStrapi) notFound();

  const page = await getPageBySlug(slugStrapi);
  if (!page) notFound();

  return <SectionRenderer sections={page.sections ?? []} />;
}
