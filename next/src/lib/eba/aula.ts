import { resolveStrapiMedia, type MediaView } from '@/lib/strapi/media';
import type { StrapiAula } from './types';

/**
 * Aulas em vídeo do DNA e do Reset (área da equipe, entrega 4). O endereço do vídeo vem do Strapi, então
 * só vira `<iframe>` se for **exatamente** o player do Vimeo (host, caminho e parâmetros conferidos).
 */

export type CursoDeAulas = 'dna' | 'reset';

/** Os dois cursos, na ordem e com o rótulo do menu do site atual. */
export const CURSOS_DE_AULAS: readonly { slug: CursoDeAulas; nome: string; rotulo: string }[] = [
  { slug: 'reset', nome: 'Reset', rotulo: 'Aulas / Reset' },
  { slug: 'dna', nome: 'DNA', rotulo: 'Aulas / DNA' },
];

/** O curso do endereço (`/eba/equipe/aulas/<curso>`), ou null. */
export function curso(slug: string): { slug: CursoDeAulas; nome: string; rotulo: string } | null {
  return CURSOS_DE_AULAS.find((c) => c.slug === slug) ?? null;
}

export interface AulaView {
  curso: CursoDeAulas;
  endereco: string;
  titulo: string;
  autor: string | null;
  cargoAutor: string | null;
  descricao: string | null;
  videoUrl: string;
  fotoAutor: MediaView | null;
  ordem: number;
}

const ORDEM_PADRAO = 100;
const ENDERECO = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const ID_DO_VIDEO = /^\/video\/\d+$/;
const VALOR = /^[A-Za-z0-9]{1,40}$/;
/** Opções de incorporação do Vimeo que o site atual já usava (`h` é o código do vídeo não listado). */
const PARAMETROS = new Set(['h', 'title', 'byline', 'portrait', 'badge', 'autopause', 'player_id', 'app_id', 'dnt']);

const texto = (valor: string | null | undefined) => valor?.trim() || null;

/**
 * Endereço do player do Vimeo (`https://player.vimeo.com/video/<número>?h=…`) ou null. Aceita só https, o
 * host exato, sem porta nem credenciais, caminho `/video/<número>` e os parâmetros conhecidos com valor
 * simples. `&amp;` e aspas nas pontas (como o site atual guardava) são limpos. O resultado é remontado
 * a partir das partes conferidas.
 */
export function urlDoVideo(url: string | null | undefined): string | null {
  const limpa = url?.replace(/&amp;/g, '&').trim().replace(/["'\\]+$/, '').trim();
  if (!limpa) return null;
  let u: URL;
  try {
    u = new URL(limpa);
  } catch {
    return null;
  }
  if (u.protocol !== 'https:' || u.hostname !== 'player.vimeo.com' || u.port || u.username || u.password || u.hash) return null;
  if (!ID_DO_VIDEO.test(u.pathname)) return null;
  const pares: string[] = [];
  for (const [chave, valor] of u.searchParams) {
    if (!PARAMETROS.has(chave) || !VALOR.test(valor)) return null;
    pares.push(`${chave}=${valor}`);
  }
  return `https://player.vimeo.com${u.pathname}${pares.length > 0 ? `?${pares.join('&')}` : ''}`;
}

/** Aula do Strapi. Sem título, curso conhecido, endereço válido ou vídeo do Vimeo → null (a aula não aparece). */
export function normalizeAula(aula: StrapiAula): AulaView | null {
  const titulo = texto(aula.titulo);
  const cursoDaAula = curso(aula.curso ?? '');
  const endereco = aula.endereco?.trim() ?? '';
  const videoUrl = urlDoVideo(aula.video_url);
  if (!titulo || !cursoDaAula || !ENDERECO.test(endereco) || !videoUrl) return null;
  return {
    curso: cursoDaAula.slug,
    endereco,
    titulo,
    autor: texto(aula.autor),
    cargoAutor: texto(aula.cargo_autor),
    descricao: texto(aula.descricao),
    videoUrl,
    fotoAutor: resolveStrapiMedia(aula.foto_autor),
    ordem: typeof aula.ordem === 'number' ? aula.ordem : ORDEM_PADRAO,
  };
}

/** Ordem do Strapi (menor primeiro), depois título. */
export function ordenarAulas(aulas: AulaView[]): AulaView[] {
  return [...aulas].sort((a, b) => a.ordem - b.ordem || a.titulo.localeCompare(b.titulo, 'pt-BR'));
}
