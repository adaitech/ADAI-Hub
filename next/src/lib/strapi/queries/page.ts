import { draftMode } from 'next/headers';
import { sectionsPopulate } from '@/lib/registry/sectionRegistry';
import { strapiFetch } from '../client';
import type { StrapiCollectionResponse, StrapiPage } from '../types';

/** Página do Strapi pelo slug (`home` = página inicial). Em draft mode traz o rascunho. */
export async function getPageBySlug(slug: string): Promise<StrapiPage | null> {
  const { isEnabled: draft } = await draftMode();

  const response = await strapiFetch<StrapiCollectionResponse<StrapiPage>>(
    'pages',
    {
      filters: { slug: { $eq: slug } },
      populate: {
        seo: { populate: { metaImage: true } },
        sections: { on: sectionsPopulate() },
      },
      pagination: { pageSize: 1 },
    },
    { tags: [`page:${slug}`], draft },
  );

  return response.data[0] ?? null;
}
