import type { TesteView } from '@/lib/eba/types';

/** JSON cru de `sections.lista-testes`: só a configuração. Os testes vêm do tipo Testes da EBA. */
export interface ListaTestesData {
  __component: 'sections.lista-testes';
  id: number;
  titulo?: string | null;
  texto_apoio?: string | null;
  mostrar_atalhos?: boolean | null;
}

export interface ListaTestesView {
  titulo: string;
  textoApoio?: string;
  atalhos: boolean;
}

/** Exemplo da vitrine: configuração do Strapi + testes normalizados + posição na página. */
export interface ListaTestesExemplo {
  strapi: ListaTestesData;
  testes: TesteView[];
  index: number;
}
