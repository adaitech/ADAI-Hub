import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { SectionRenderer } from '@/components/sections/SectionRenderer';
import { buildMetadata } from '@/lib/metadata';
import { getGlobal } from '@/lib/strapi/queries/global';
import { getPageBySlug } from '@/lib/strapi/queries/page';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [page, global] = await Promise.all([getPageBySlug(slug), getGlobal()]);
  if (!page) return { title: 'Página não encontrada | ADAI', robots: { index: false } };
  return buildMetadata(page.seo, global?.seo, `/${slug}`);
}

/** Qualquer página montada no Strapi (ex.: /kids). */
export default async function StrapiPage({ params }: PageProps) {
  const { slug } = await params;
  if (slug === 'home') redirect('/');

  const page = await getPageBySlug(slug);
  if (!page) notFound();

  return <SectionRenderer sections={page.sections ?? []} />;
}
