/** Tipos crus da API REST do Strapi 5 (formato "flat", sem `attributes`). */

export interface StrapiMediaFormat {
  url: string;
  width: number;
  height: number;
  mime?: string;
}

export interface StrapiMedia {
  id: number;
  url: string;
  alternativeText?: string | null;
  width?: number | null;
  height?: number | null;
  mime?: string;
  formats?: Record<string, StrapiMediaFormat> | null;
}

/** `shared.link` */
export interface StrapiLink {
  id: number;
  texto?: string | null;
  url?: string | null;
  nova_aba?: boolean | null;
}

/** `shared.botao` */
export interface StrapiBotao extends StrapiLink {
  estilo?: 'solido' | 'contorno' | null;
}

/** `shared.seo` */
export interface StrapiSeo {
  id: number;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaImage?: StrapiMedia | null;
  canonicalURL?: string | null;
  metaRobots?: string | null;
}

/** Item da dynamic zone `sections`. */
export interface StrapiSection {
  __component: string;
  id: number;
}

export interface StrapiPage {
  id: number;
  documentId: string;
  titulo: string;
  slug: string;
  seo?: StrapiSeo | null;
  sections?: StrapiSection[] | null;
}

export interface StrapiCollectionResponse<T> {
  data: T[];
  meta: unknown;
}

export interface StrapiSingleResponse<T> {
  data: T | null;
  meta: unknown;
}

/** Fragmento de populate declarado por cada seção/bloco (`populate.ts`). */
export interface StrapiPopulate {
  populate: Record<string, true | StrapiPopulate>;
}

/**
 * Populate de uma seção na dynamic zone. `true` = seção só com campos simples: o Strapi 5
 * omite da resposta o componente que não aparece em `on`, então ele precisa estar lá.
 */
export type StrapiSectionPopulate = StrapiPopulate | true;
