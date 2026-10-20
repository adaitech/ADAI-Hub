import type { MetadataRoute } from 'next';
import { montarSitemap } from '@/lib/seo/sitemap';
import { configuracaoSeo } from '@/lib/seo/site';
import { listarPaginasPublicadas } from '@/lib/strapi/queries/paginas';
import { getEventosInchurch } from '@/lib/inchurch/eventos-cache';
import { eventosDaAgenda } from '@/lib/inchurch/eventos';
import { urlDoEvento } from '@/lib/inchurch/detalhes';

/**
 * `/sitemap.xml` — páginas publicadas no Strapi. Segue o cache do Strapi (60 s + webhook de
 * publicação); se o Strapi falhar, o Next continua servindo o último sitemap gerado.
 * Fora de produção, vazio (o robots.txt também bloqueia tudo).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { indexavel, url } = configuracaoSeo();
  if (!indexavel || !url) return [];
  const [paginas, eventos] = await Promise.all([listarPaginasPublicadas(), getEventosInchurch()]);
  return [...montarSitemap(paginas, url), ...(eventos ? eventosDaAgenda(eventos).map((evento) => ({ url: `${url}${urlDoEvento(evento)}`, priority: 0.7 })) : [])];
}
