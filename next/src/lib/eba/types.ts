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

/** JSON cru de um teste do CDV (`api::teste.teste`) como a API do Strapi entrega. */
export interface StrapiTeste {
  id: number;
  documentId: string;
  nome?: string | null;
  slug?: string | null;
  aula?: string | null;
  resumo?: string | null;
  o_que_e?: string | null;
  itens_titulo?: string | null;
  /** Um item por linha. */
  itens?: string | null;
  perguntas?: string | null;
  resposta?: string | null;
  como_responder?: string | null;
  como_ler_resultado?: string | null;
  link_teste?: string | null;
  ordem?: number | null;
}

/** O que a Lista de testes precisa de cada teste. Parte vazia = null (não aparece). */
export interface TesteView {
  slug: string;
  nome: string;
  resumo: string;
  aula: string | null;
  oQueE: string | null;
  itensTitulo: string | null;
  itens: string[];
  perguntas: string | null;
  resposta: string | null;
  comoResponder: string | null;
  comoLerResultado: string | null;
  /** Onde a pessoa faz o teste (https ou caminho interno); null = sem botão. */
  link: string | null;
  ordem: number;
}
