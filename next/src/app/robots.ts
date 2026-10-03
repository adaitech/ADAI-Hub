import type { MetadataRoute } from 'next';
import { montarRobots } from '@/lib/seo/robots';
import { configuracaoSeo } from '@/lib/seo/site';

/** `/robots.txt` — só o site oficial (`SITE_INDEXAVEL=true`) é liberado para o Google. */
export default function robots(): MetadataRoute.Robots {
  return montarRobots(configuracaoSeo());
}
