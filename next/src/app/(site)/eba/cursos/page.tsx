import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SectionRenderer } from '@/components/sections/SectionRenderer';
import { Trilha, type TrilhaItem } from '@/components/ui/Trilha';
import { schemaDaTrilha, schemaDoCatalogo } from '@/lib/eba/dados-estruturados';
import { buildMetadata } from '@/lib/metadata';
import { caminhoDaPagina } from '@/lib/paginas/caminho';
import { jsonLdSeguro, origemDoSite } from '@/lib/seo/json-ld';
import { listarCursosPublicados } from '@/lib/strapi/queries/cursos';
import { getGlobal } from '@/lib/strapi/queries/global';
import { getPageBySlug } from '@/lib/strapi/queries/page';
import styles from '../eba.module.css';

const SLUG = 'eba-cursos';
const TRILHA: TrilhaItem[] = [{ texto: 'ADAI', href: '/' }, { texto: 'EBA', href: '/eba' }, { texto: 'Cursos' }];

export async function generateMetadata(): Promise<Metadata> {
  const [page, global] = await Promise.all([getPageBySlug(SLUG), getGlobal()]);
  if (!page) return { title: 'Página não encontrada | ADAI', robots: { index: false } };
  return buildMetadata(page.seo, global?.seo, caminhoDaPagina(SLUG));
}

/** /eba/cursos — página "eba-cursos" do Strapi (abertura + Catálogo de cursos), com trilha e ItemList. */
export default async function CursosEbaPage() {
  const page = await getPageBySlug(SLUG);
  if (!page) notFound();

  const site = origemDoSite();
  // Sem a lista (Strapi falhou), a página continua: só o ItemList fica de fora.
  const cursos = await listarCursosPublicados().catch(() => []);
  return (
    <>
      <script type="application/ld+json">{jsonLdSeguro(schemaDaTrilha(TRILHA, site))}</script>
      {cursos.length > 0 && <script type="application/ld+json">{jsonLdSeguro(schemaDoCatalogo(cursos, site))}</script>}
      <div className={styles.trilha}>
        <Trilha itens={TRILHA} />
      </div>
      <SectionRenderer sections={page.sections ?? []} />
    </>
  );
}
