import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactElement } from 'react';
import { SectionRenderer } from '@/components/sections/SectionRenderer';
import { Trilha, type TrilhaItem } from '@/components/ui/Trilha';
import { schemaDaTrilha } from '@/lib/eba/dados-estruturados';
import { buildMetadata } from '@/lib/metadata';
import { caminhoDaPagina } from '@/lib/paginas/caminho';
import { jsonLdSeguro, origemDoSite } from '@/lib/seo/json-ld';
import { getGlobal } from '@/lib/strapi/queries/global';
import { getPageBySlug } from '@/lib/strapi/queries/page';
import styles from './eba.module.css';

/**
 * Página "eba-<x>" do Strapi em /eba/<x>, usada por `/eba/[slug]` e pelas rotas estáticas que
 * ganham subpastas (ex.: `/eba/testes`, que tem `/eba/testes/[slug]` e por isso precisa de page própria).
 * `slugStrapi` null (segmento fora do padrão) → 404 sem chamar o Strapi.
 */
export async function metadataDaPaginaEba(slugStrapi: string | null): Promise<Metadata> {
  const [page, global] = slugStrapi ? await Promise.all([getPageBySlug(slugStrapi), getGlobal()]) : [null, null];
  if (!page || !slugStrapi) return { title: 'Página não encontrada | ADAI', robots: { index: false } };
  return buildMetadata(page.seo, global?.seo, caminhoDaPagina(slugStrapi));
}

/** Trilha ADAI › EBA › <título da página no Strapi>, com BreadcrumbList, `aposATrilha` (opcional) e as seções da página. */
export async function paginaEba(slugStrapi: string | null, aposATrilha?: ReactElement | null): Promise<ReactElement> {
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
      {aposATrilha}
      <SectionRenderer sections={page.sections ?? []} />
    </>
  );
}
