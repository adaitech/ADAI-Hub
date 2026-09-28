import type { LinkView } from '@/lib/strapi/links';
import type { StrapiLink } from '@/lib/strapi/types';

/** `items.coluna-links` */
export interface FooterColunaData {
  id: number;
  titulo?: string | null;
  links?: StrapiLink[] | null;
}

/** JSON cru de `layout.footer` (dentro do single type `global`). */
export interface FooterData {
  id: number;
  texto_marca?: string | null;
  colunas?: FooterColunaData[] | null;
  copyright?: string | null;
  assinatura?: string | null;
}

export interface FooterColunaView {
  titulo: string;
  links: LinkView[];
}

export interface FooterView {
  textoMarca?: string;
  colunas: FooterColunaView[];
  copyright?: string;
  assinatura?: string;
}
