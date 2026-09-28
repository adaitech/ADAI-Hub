import type { BotaoView, LinkView } from '@/lib/strapi/links';
import type { StrapiBotao, StrapiLink } from '@/lib/strapi/types';

/** JSON cru de `layout.header` (dentro do single type `global`). */
export interface HeaderData {
  id: number;
  links?: StrapiLink[] | null;
  botoes?: StrapiBotao[] | null;
}

export interface HeaderView {
  links: LinkView[];
  botoes: BotaoView[];
}
