import type { MetadataRoute } from 'next';
import type { ConfiguracaoSeo } from './site';

/** Áreas internas: API, vitrine `/componentes` e a página de exemplos de desenvolvimento. */
export const CAMINHOS_FORA_DO_GOOGLE = ['/api/', '/componentes', '/exemplos'];

/** `/robots.txt`: site oficial liberado (menos áreas internas) com o sitemap; o resto, bloqueado. */
export function montarRobots({ indexavel, url }: ConfiguracaoSeo): MetadataRoute.Robots {
  if (!indexavel || !url) return { rules: { userAgent: '*', disallow: '/' } };
  return {
    rules: { userAgent: '*', allow: '/', disallow: CAMINHOS_FORA_DO_GOOGLE },
    sitemap: `${url}/sitemap.xml`,
  };
}
