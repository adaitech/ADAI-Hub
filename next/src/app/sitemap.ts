import type { MetadataRoute } from 'next';
import { montarSitemap } from '@/lib/seo/sitemap';
import { configuracaoSeo } from '@/lib/seo/site';
import { listarPaginasPublicadas } from '@/lib/strapi/queries/paginas';

/**
 * `/sitemap.xml` — páginas publicadas no Strapi. Segue o cache do Strapi (60 s + webhook de
 * publicação); se o Strapi falhar, o Next continua servindo o último sitemap gerado.
 * Fora de produção, vazio (o robots.txt também bloqueia tudo).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { indexavel, url } = configuracaoSeo();
  if (!indexavel || !url) return [];
  return montarSitemap(await listarPaginasPublicadas(), url);
}
