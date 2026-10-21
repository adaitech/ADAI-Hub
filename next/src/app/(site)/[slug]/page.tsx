import type { Metadata } from 'next';
import { notFound, permanentRedirect, redirect } from 'next/navigation';
import { SectionRenderer } from '@/components/sections/SectionRenderer';
import { buildMetadata } from '@/lib/metadata';
import { caminhoDaPagina, PREFIXO_EBA, PREFIXO_SOBRE_NOS } from '@/lib/paginas/caminho';
import { getGlobal } from '@/lib/strapi/queries/global';
import { getPageBySlug } from '@/lib/strapi/queries/page';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [page, global] = await Promise.all([getPageBySlug(slug), getGlobal()]);
  if (!page) return { title: 'Página não encontrada | ADAI', robots: { index: false } };
  return buildMetadata(page.seo, global?.seo, caminhoDaPagina(slug), page.sections);
}

/** Qualquer página montada no Strapi (ex.: /kids). */
export default async function StrapiPage({ params }: PageProps) {
  const { slug } = await params;
  if (slug === 'home') redirect('/');
  // Páginas "sobre-nos-…" e "eba-…" moram em /sobre-nos/… e /eba/… (sem conteúdo duplicado no endereço plano).
  if (slug.startsWith(PREFIXO_SOBRE_NOS) || slug.startsWith(PREFIXO_EBA)) permanentRedirect(caminhoDaPagina(slug));

  const page = await getPageBySlug(slug);
  if (!page) notFound();

  return <SectionRenderer sections={page.sections ?? []} apresentacao={page.apresentacao} />;
}
