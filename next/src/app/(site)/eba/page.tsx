import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SectionRenderer } from '@/components/sections/SectionRenderer';
import { buildMetadata } from '@/lib/metadata';
import { caminhoDaPagina } from '@/lib/paginas/caminho';
import { getGlobal } from '@/lib/strapi/queries/global';
import { getPageBySlug } from '@/lib/strapi/queries/page';

/** Página "eba" do Strapi. A pasta `eba/` (para /eba/cursos) tem precedência sobre o `[slug]` genérico. */
const SLUG = 'eba';

export async function generateMetadata(): Promise<Metadata> {
  const [page, global] = await Promise.all([getPageBySlug(SLUG), getGlobal()]);
  if (!page) return { title: 'Página não encontrada | ADAI', robots: { index: false } };
  return buildMetadata(page.seo, global?.seo, caminhoDaPagina(SLUG));
}

/** /eba — home da Escola Bíblica ADAI, montada no Strapi. */
export default async function EbaPage() {
  const page = await getPageBySlug(SLUG);
  if (!page) notFound();
  return <SectionRenderer sections={page.sections ?? []} />;
}
