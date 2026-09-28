import { footerPopulate, type FooterData } from '@/components/layout/Footer';
import { headerPopulate, type HeaderData } from '@/components/layout/Header';
import { StrapiError, strapiFetch } from '../client';
import type { StrapiSeo, StrapiSingleResponse } from '../types';

export interface StrapiGlobal {
  header?: HeaderData | null;
  footer?: FooterData | null;
  seo?: StrapiSeo | null;
}

/** Single type `global` (cabeçalho, rodapé, SEO padrão). Ainda não cadastrado → null. */
export async function getGlobal(): Promise<StrapiGlobal | null> {
  try {
    const response = await strapiFetch<StrapiSingleResponse<StrapiGlobal>>(
      'global',
      {
        populate: {
          header: headerPopulate,
          footer: footerPopulate,
          seo: { populate: { metaImage: true } },
        },
      },
      { tags: ['global'] },
    );
    return response.data;
  } catch (error) {
    if (error instanceof StrapiError && error.status === 404) return null;
    throw error;
  }
}
