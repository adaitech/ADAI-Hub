import type { Metadata } from 'next';
import { resolveStrapiMedia } from './strapi/media';
import type { StrapiSeo } from './strapi/types';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

/** SEO da página no Strapi, com o SEO padrão de `global` como reserva. */
export function buildMetadata(seo?: StrapiSeo | null, fallback?: StrapiSeo | null, path = '/'): Metadata {
  const title = seo?.metaTitle ?? fallback?.metaTitle ?? 'ADAI';
  const description = seo?.metaDescription ?? fallback?.metaDescription ?? undefined;
  const image = resolveStrapiMedia(seo?.metaImage ?? fallback?.metaImage);

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: { canonical: seo?.canonicalURL ?? path },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'pt_BR',
      url: path,
      images: image ? [{ url: image.url, width: image.width, height: image.height, alt: image.alt }] : undefined,
    },
  };
}
