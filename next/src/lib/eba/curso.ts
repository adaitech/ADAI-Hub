import { caminhoDoCurso, slugDoCurso } from '@/lib/paginas/caminho';
import { normalizeBotoes } from '@/lib/strapi/links';
import { resolveStrapiMedia } from '@/lib/strapi/media';
import type { VideoSerie } from '@/lib/youtube/serie';
import type { ChipView, CursoResumoView, CursoView, Formato, StrapiCurso, Vertente } from './types';

const ORDEM_PADRAO = 100;

const ROTULO_VERTENTE: Record<Vertente, string> = {
  integracao: 'Curso de integração',
  consolidacao: 'Curso de consolidação',
};

const TEXTO_FORMATO: Record<Formato, string> = {
  presencial: 'Presencial',
  online: 'On-line',
  presencial_ou_online: 'Presencial ou on-line',
};

const HOSTS_YOUTUBE = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be']);
const ID_YOUTUBE = /^[A-Za-z0-9_-]{11}$/;

const texto = (valor: string | null | undefined) => valor?.trim() || null;

function chipsDo(curso: StrapiCurso): ChipView[] {
  const formato = curso.formato ? TEXTO_FORMATO[curso.formato] : null;
  const pares: [string, string | null][] = [
    ['Para quem', texto(curso.publico_alvo)],
    ['Duração', texto(curso.duracao)],
    ['Formato', formato ?? null],
    ['Quando entrar', texto(curso.entrada)],
  ];
  return pares.flatMap(([rotulo, valor]) => (valor ? [{ rotulo, valor }] : []));
}

/** Card do catálogo. Sem nome, slug válido ou resumo → null (o curso não aparece). */
export function normalizeCursoResumo(curso: StrapiCurso): CursoResumoView | null {
  const nome = texto(curso.nome);
  const resumo = texto(curso.resumo);
  const slug = slugDoCurso(curso.slug?.trim() ?? '');
  if (!nome || !resumo || !slug) return null;

  const vertente: Vertente = curso.vertente === 'consolidacao' ? 'consolidacao' : 'integracao';
  const capa = resolveStrapiMedia(curso.capa);
  return {
    slug,
    nome,
    resumo,
    href: caminhoDoCurso(slug),
    vertente,
    rotuloVertente: ROTULO_VERTENTE[vertente],
    // Capa é conteúdo: sem texto alternativo, não aparece.
    capa: capa?.alt ? capa : null,
    chips: chipsDo(curso),
    ordem: typeof curso.ordem === 'number' ? curso.ordem : ORDEM_PADRAO,
  };
}

/** Página do curso. */
export function normalizeCurso(curso: StrapiCurso): CursoView | null {
  const resumo = normalizeCursoResumo(curso);
  if (!resumo) return null;
  const secoes = curso.secoes ?? [];
  return {
    ...resumo,
    inscricao: normalizeBotoes(curso.inscricao ? [curso.inscricao] : [])[0] ?? null,
    video: videoDoYoutube(curso.video_apresentacao),
    secoes,
    temPerguntasFrequentes: secoes.some((s) => s.__component === 'sections.perguntas-frequentes'),
    seo: curso.seo ?? null,
    atualizadoEm: curso.updatedAt ?? null,
  };
}

/** Link colado sem "https://" (ex.: "youtu.be/ID") ganha o esquema; outros textos ficam como estão. */
const SEM_ESQUEMA_YOUTUBE = /^((www|m)\.)?(youtube\.com|youtu\.be)\//i;

/** Link do YouTube (watch, youtu.be, shorts, embed, live) → vídeo no player do site. Outro endereço → null. */
export function videoDoYoutube(url: string | null | undefined): VideoSerie | null {
  const bruto = url?.trim() ?? '';
  let endereco: URL;
  try {
    endereco = new URL(SEM_ESQUEMA_YOUTUBE.test(bruto) ? `https://${bruto}` : bruto);
  } catch {
    return null;
  }
  if (!HOSTS_YOUTUBE.has(endereco.hostname)) return null;

  const partes = endereco.pathname.split('/').filter(Boolean);
  const id =
    endereco.hostname === 'youtu.be'
      ? partes[0]
      : partes[0] === 'watch'
        ? endereco.searchParams.get('v')
        : ['shorts', 'embed', 'live'].includes(partes[0]) ? partes[1] : null;
  if (!id || !ID_YOUTUBE.test(id)) return null;

  return {
    videoId: id,
    youtubeUrl: `https://www.youtube.com/watch?v=${id}`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
    thumbnail: null,
    embeddable: true,
  };
}

/** Ordena (ordem, depois nome) e filtra os cursos do catálogo. */
export function filtrarCursos(
  cursos: CursoResumoView[],
  { vertente = 'todas', quantidade = null, excluirSlug }: { vertente?: 'todas' | Vertente; quantidade?: number | null; excluirSlug?: string } = {},
): CursoResumoView[] {
  const lista = cursos
    .filter((c) => (vertente === 'todas' || c.vertente === vertente) && c.slug !== excluirSlug)
    .sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome, 'pt-BR'));
  return quantidade ? lista.slice(0, quantidade) : lista;
}
