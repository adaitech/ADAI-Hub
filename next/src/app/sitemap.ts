import type { MetadataRoute } from 'next';
import { montarSitemap, montarSitemapCursos } from '@/lib/seo/sitemap';
import { configuracaoSeo } from '@/lib/seo/site';
import { listarCursosParaSitemap } from '@/lib/strapi/queries/cursos';
import { listarPaginasPublicadas } from '@/lib/strapi/queries/paginas';
import { getEventosInchurch } from '@/lib/inchurch/eventos-cache';
import { eventosDaAgenda } from '@/lib/inchurch/eventos';
import { urlDoEvento } from '@/lib/inchurch/detalhes';

/**
 * `/sitemap.xml` — páginas e cursos da EBA publicados no Strapi, e eventos da agenda. Segue o cache do Strapi (60 s + webhook de
 * publicação); se o Strapi falhar, o Next continua servindo o último sitemap gerado.
 * Fora de produção, vazio (o robots.txt também bloqueia tudo).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { indexavel, url } = configuracaoSeo();
  if (!indexavel || !url) return [];
  const [paginas, cursos, eventos] = await Promise.all([listarPaginasPublicadas(), listarCursosParaSitemap(), getEventosInchurch()]);
  return [...montarSitemap(paginas, url), ...montarSitemapCursos(cursos, url), ...(eventos ? eventosDaAgenda(eventos).map((evento) => ({ url: `${url}${urlDoEvento(evento)}`, priority: 0.7 })) : [])];
}
