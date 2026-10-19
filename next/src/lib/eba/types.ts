import type { BotaoView } from '@/lib/strapi/links';
import type { MediaView } from '@/lib/strapi/media';
import type { StrapiBotao, StrapiMedia, StrapiSection, StrapiSeo } from '@/lib/strapi/types';
import type { VideoSerie } from '@/lib/youtube/serie';

export type Vertente = 'integracao' | 'consolidacao';
export type Formato = 'presencial' | 'online' | 'presencial_ou_online';

/** JSON cru de um curso (`api::curso.curso`) como a API do Strapi entrega. */
export interface StrapiCurso {
  id: number;
  documentId: string;
  nome?: string | null;
  slug?: string | null;
  resumo?: string | null;
  capa?: StrapiMedia | null;
  vertente?: Vertente | null;
  publico_alvo?: string | null;
  duracao?: string | null;
  formato?: Formato | null;
  entrada?: string | null;
  inscricao?: StrapiBotao | null;
  video_apresentacao?: string | null;
  ordem?: number | null;
  secoes?: StrapiSection[] | null;
  seo?: StrapiSeo | null;
  updatedAt?: string | null;
}

/** Informação curta do curso, com rótulo visível ("Para quem", "Duração"…). */
export interface ChipView {
  rotulo: string;
  valor: string;
}

/** O que o card do catálogo precisa. */
export interface CursoResumoView {
  slug: string;
  nome: string;
  resumo: string;
  href: string;
  vertente: Vertente;
  rotuloVertente: string;
  capa: MediaView | null;
  chips: ChipView[];
  ordem: number;
}

/** O que a página do curso precisa. */
export interface CursoView extends CursoResumoView {
  inscricao: BotaoView | null;
  video: VideoSerie | null;
  secoes: StrapiSection[];
  temPerguntasFrequentes: boolean;
  seo: StrapiSeo | null;
  atualizadoEm: string | null;
}
