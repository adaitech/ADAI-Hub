import type { StrapiLink } from '@/lib/strapi/types';

/** JSON de `sections.pix`: dados editoriais para contribuições pelo aplicativo do banco. */
export interface PixData {
  __component: 'sections.pix';
  id: number;
  titulo?: string | null;
  texto_apoio?: string | null;
  chave_pix?: string | null;
  favorecido?: string | null;
  cnpj?: string | null;
  passos?: string | null;
  contato?: StrapiLink | null;
  ancora?: string | null;
}
