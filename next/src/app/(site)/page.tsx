import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SectionRenderer } from '@/components/sections/SectionRenderer';
import { buildMetadata } from '@/lib/metadata';
import { getGlobal } from '@/lib/strapi/queries/global';
import { getPageBySlug } from '@/lib/strapi/queries/page';

const HOME_SLUG = 'home';

export async function generateMetadata(): Promise<Metadata> {
  const [page, global] = await Promise.all([getPageBySlug(HOME_SLUG), getGlobal()]);
  return buildMetadata(page?.seo, global?.seo, '/');
}

export default async function HomePage() {
  const page = await getPageBySlug(HOME_SLUG);
  if (!page) notFound();

  return <SectionRenderer sections={page.sections ?? []} />;
}
