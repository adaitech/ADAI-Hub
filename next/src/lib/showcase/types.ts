import type { ReactNode } from 'react';

export type ShowcaseCategoria = 'ui' | 'layout' | 'secao';

export interface ShowcaseVariant<TData> {
  /** Identificador usado na URL (?variante=). Seções: `completo`, `minimo`, `texto_longo`. */
  nome: string;
  titulo: string;
  descricao?: string;
  data: TData;
}

interface ControleBase {
  /** Chave na URL do preview (`?variante=completo&cor=azul`). Curta, sem acento. */
  id: string;
  rotulo: string;
  /** Frase curta abaixo do controle (ex.: "Só aparece com foto"). */
  ajuda?: string;
}

/** Liga/desliga (ex.: "Foto nos cards"). */
export interface ControleAlternar<TData> extends ControleBase {
  tipo: 'alternar';
  /** Estado da variação sem mexer em nada: é o valor inicial do controle. */
  valor: (data: TData) => boolean;
  aplicar: (data: TData, ligado: boolean) => TData;
}

/** Uma opção entre várias (ex.: cor, lado da foto, botão ou link). */
export interface ControleOpcoes<TData> extends ControleBase {
  tipo: 'opcoes';
  opcoes: { valor: string; rotulo: string }[];
  valor: (data: TData) => string;
  aplicar: (data: TData, valor: string) => TData;
}

/**
 * Controle da vitrine: muda o JSON da variação como o editor mudaria no Strapi.
 * `aplicar` recebe sempre o JSON original da variação e devolve uma cópia (nunca muta).
 */
export type ShowcaseControle<TData> = ControleAlternar<TData> | ControleOpcoes<TData>;

/** Versão serializável do controle, enviada ao componente cliente das abas. */
export type ControleInfo =
  | (ControleBase & { tipo: 'alternar' })
  | (ControleBase & { tipo: 'opcoes'; opcoes: { valor: string; rotulo: string }[] });

export type ValoresControles = Record<string, string | boolean>;

export interface ShowcaseEntry<TData = unknown> {
  slug: string;
  nome: string;
  categoria: ShowcaseCategoria;
  /** Nome técnico no Strapi (`sections.hero`, `layout.header`). `null` para componentes de UI. */
  cmsKey: string | null;
  descricao: string;
  quandoUsar: string;
  /** Caminho do doc a partir da raiz do repositório. */
  doc: string;
  figma?: string;
  /** Fundo da pré-visualização. */
  fundo?: 'claro' | 'escuro';
  render: (data: TData) => ReactNode;
  variantes: ShowcaseVariant<TData>[];
  /**
   * Quando o exemplo junta o JSON do Strapi com dados de fora do CMS (ex.: Série atual = config do
   * Strapi + resultado do YouTube), devolve só a parte do Strapi (usada pelo teste do guia do editor).
   */
  cms?: (data: TData) => unknown;
  /** Liga/desliga opções do componente na vitrine (cor, botão ou link, posição da foto...). */
  controles?: ShowcaseControle<TData>[];
}

/** Ajuda a tipar cada entrada e a guardá-las juntas no catálogo. */
export function defineShowcase<TData>(entry: ShowcaseEntry<TData>): ShowcaseEntry {
  return entry as unknown as ShowcaseEntry;
}
