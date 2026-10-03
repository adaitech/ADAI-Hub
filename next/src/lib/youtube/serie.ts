import { diaEmSaoPaulo, domingoDe, domingosDoMes, lerData } from './domingos';
import { getBestYoutubeThumbnail } from './thumbnails';
import { isAdaiLiveService, normalizarComparacao, parseSermonTitle } from './titulo';
import type { YoutubePlaylistItem, YoutubeThumbnail, YoutubeVideo } from './types';

/**
 * Regras da "Série atual" (sem React, sem rede): vídeos da playlist → um conteúdo por domingo →
 * partes numeradas. Dividido em duas etapas:
 * 1. `normalizeSerie`: resultado que vai para o cache (não depende do dia de hoje);
 * 2. `montarSerieAtual`: aplica o dia de hoje (partes futuras, "Culto de hoje") e o título do CMS
 *    a cada renderização.
 */

export type StatusParte = 'published' | 'live' | 'waiting-sermon-cut' | 'upcoming';

export interface VideoSerie {
  videoId: string;
  youtubeUrl: string;
  embedUrl: string;
  thumbnail: YoutubeThumbnail | null;
  /** `status.embeddable` do YouTube. Falso → abre direto no YouTube, sem player interno. */
  embeddable: boolean;
}

/** O conteúdo escolhido para um domingo. */
export interface ConteudoDomingo {
  /** `YYYY-MM-DD` em São Paulo. */
  domingo: string;
  status: Exclude<StatusParte, 'upcoming'>;
  /** Vídeo "Culto ao vivo | ADAI On" (culto completo), e não a mensagem editada. */
  culto: boolean;
  tema: string | null;
  pregador: string | null;
  video: VideoSerie;
}

export type FonteTituloSerie = 'video' | 'playlist' | 'fallback';

/** Resultado normalizado que fica no cache (JSON puro). */
export interface SerieYoutube {
  playlistId: string;
  playlistUrl: string;
  titulo: string;
  tituloFonte: FonteTituloSerie;
  /** Em ordem cronológica, um por domingo. */
  conteudos: ConteudoDomingo[];
  /** Alguma transmissão da série está ao vivo agora → cache de 5 minutos. */
  aoVivo: boolean;
  /** Início agendado da próxima transmissão da playlist (ISO), se houver. */
  proximaTransmissao: string | null;
  atualizadoEm: string;
}

export interface ParteSerie {
  parte: number;
  status: StatusParte;
  /** Domingo (`YYYY-MM-DD`). `null` nas partes futuras: não inventamos data. */
  data: string | null;
  /** Tema ("Batalhas morais"), "Culto de hoje" / "Culto completo", ou `null`. */
  titulo: string | null;
  pregador: string | null;
  video: VideoSerie | null;
}

export interface SerieAtual {
  serie: { titulo: string; tituloFonte: FonteTituloSerie | 'cms'; playlistId: string; playlistUrl: string };
  /** Destaque: a parte mais recente com vídeo (ao vivo, aguardando corte ou publicada). */
  atual: ParteSerie | null;
  partes: ParteSerie[];
}

export const TITULO_SERIE_FALLBACK = 'Mensagens';

export function playlistUrl(playlistId: string): string {
  return `https://www.youtube.com/playlist?list=${encodeURIComponent(playlistId)}`;
}

function videoSerie(videoId: string, video: YoutubeVideo, item: YoutubePlaylistItem): VideoSerie {
  const id = encodeURIComponent(videoId);
  return {
    videoId,
    youtubeUrl: `https://www.youtube.com/watch?v=${id}`,
    // Domínio sem cookies do YouTube (Política de Privacidade §7.5): o player só grava cookies se a pessoa interagir.
    embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
    thumbnail: getBestYoutubeThumbnail(video.snippet?.thumbnails) ?? getBestYoutubeThumbnail(item.snippet?.thumbnails),
    embeddable: video.status?.embeddable !== false,
  };
}

/** Prioridade dentro do mesmo domingo: mensagem definitiva > ao vivo > culto completo. */
const PESO: Record<ConteudoDomingo['status'], number> = { published: 3, live: 2, 'waiting-sermon-cut': 1 };

interface Candidato extends ConteudoDomingo {
  serieDoTitulo: string | null;
  referencia: number;
}

interface NormalizeSerieInput {
  playlist: { id: string; titulo?: string | null };
  itens: YoutubePlaylistItem[];
  /** Resposta de `videos.list` para os itens (removidos/privados simplesmente não vêm). */
  videos: YoutubeVideo[];
  agora?: Date;
}

/** Vídeos da playlist → conteúdos por domingo. Nunca lança por dado ruim: ignora o item. */
export function normalizeSerie({ playlist, itens, videos, agora = new Date() }: NormalizeSerieInput): SerieYoutube {
  const porId = new Map(videos.map((v) => [v.id, v]));
  const dicaSerie = playlist.titulo?.trim() || null;
  const porDomingo = new Map<string, Candidato>();
  let proximaTransmissao: string | null = null;

  for (const item of itens) {
    const videoId = item.contentDetails?.videoId ?? item.snippet?.resourceId?.videoId;
    const video = videoId ? porId.get(videoId) : undefined;
    if (!videoId || !video) continue; // removido, privado ou fora da resposta
    const privacidade = video.status?.privacyStatus ?? item.status?.privacyStatus;
    if (privacidade === 'private') continue;

    const titulo = video.snippet?.title ?? item.snippet?.title ?? '';
    const live = video.liveStreamingDetails;
    if (video.snippet?.liveBroadcastContent === 'upcoming') {
      const inicio = live?.scheduledStartTime;
      if (inicio && (!proximaTransmissao || inicio < proximaTransmissao)) proximaTransmissao = inicio;
      continue; // ainda não aconteceu: vira parte futura, sem inventar título
    }

    const referencia =
      lerData(live?.actualStartTime) ??
      lerData(item.contentDetails?.videoPublishedAt) ??
      lerData(video.snippet?.publishedAt) ??
      lerData(item.snippet?.publishedAt);
    if (!referencia) continue;

    const aoVivo = video.snippet?.liveBroadcastContent === 'live' && !live?.actualEndTime;
    const culto = isAdaiLiveService(titulo);
    const lido = culto ? { seriesTitle: null, topic: null, speaker: null } : parseSermonTitle(titulo, dicaSerie);
    const candidato: Candidato = {
      domingo: domingoDe(referencia),
      status: aoVivo ? 'live' : culto ? 'waiting-sermon-cut' : 'published',
      culto,
      tema: lido.topic,
      pregador: lido.speaker,
      video: videoSerie(videoId, video, item),
      serieDoTitulo: lido.seriesTitle,
      referencia: referencia.getTime(),
    };

    // Um domingo = uma parte: a mensagem definitiva substitui o culto ao vivo do mesmo domingo.
    const atual = porDomingo.get(candidato.domingo);
    if (
      !atual ||
      PESO[candidato.status] > PESO[atual.status] ||
      (PESO[candidato.status] === PESO[atual.status] && candidato.referencia > atual.referencia)
    ) {
      porDomingo.set(candidato.domingo, candidato);
    }
  }

  const candidatos = [...porDomingo.values()].sort((a, b) => a.domingo.localeCompare(b.domingo));
  const { titulo, tituloFonte } = tituloDaSerie(candidatos, dicaSerie);

  return {
    playlistId: playlist.id,
    playlistUrl: playlistUrl(playlist.id),
    titulo,
    tituloFonte,
    conteudos: candidatos.map(paraConteudo),
    aoVivo: candidatos.some((c) => c.status === 'live'),
    proximaTransmissao,
    atualizadoEm: agora.toISOString(),
  };
}

function paraConteudo({ domingo, status, culto, tema, pregador, video }: Candidato): ConteudoDomingo {
  return { domingo, status, culto, tema, pregador, video };
}

/** Nome da série: o mais frequente nos títulos das mensagens → nome da playlist → fallback. */
function tituloDaSerie(candidatos: Candidato[], dicaSerie: string | null): { titulo: string; tituloFonte: FonteTituloSerie } {
  const contagem = new Map<string, { titulo: string; vezes: number; referencia: number }>();
  for (const c of candidatos) {
    if (!c.serieDoTitulo) continue;
    const chave = normalizarComparacao(c.serieDoTitulo);
    const atual = contagem.get(chave);
    contagem.set(chave, {
      titulo: !atual || c.referencia > atual.referencia ? c.serieDoTitulo : atual.titulo,
      vezes: (atual?.vezes ?? 0) + 1,
      referencia: Math.max(atual?.referencia ?? 0, c.referencia),
    });
  }
  const melhor = [...contagem.values()].sort((a, b) => b.vezes - a.vezes || b.referencia - a.referencia)[0];
  if (melhor) return { titulo: melhor.titulo, tituloFonte: 'video' };
  if (dicaSerie) return { titulo: dicaSerie, tituloFonte: 'playlist' };
  return { titulo: TITULO_SERIE_FALLBACK, tituloFonte: 'fallback' };
}

interface MontarOpcoes {
  /** "Título personalizado" do CMS: muda só o que é exibido. */
  tituloPersonalizado?: string | null;
  agora?: Date;
}

/**
 * Aplica o dia de hoje e o CMS ao resultado cacheado.
 * Partes futuras = domingos do mês da série depois do último conteúdo e a partir de hoje
 * (mês com 5 domingos → até 5 partes; série antiga não ganha parte futura).
 */
export function montarSerieAtual(serie: SerieYoutube, { tituloPersonalizado, agora = new Date() }: MontarOpcoes = {}): SerieAtual {
  const hoje = diaEmSaoPaulo(agora);
  const conteudos = [...serie.conteudos].sort((a, b) => a.domingo.localeCompare(b.domingo));

  const publicadas: ParteSerie[] = conteudos.map((c, i) => ({
    parte: i + 1,
    status: c.status,
    data: c.domingo,
    titulo: c.culto ? (c.domingo === hoje ? 'Culto de hoje' : 'Culto completo') : c.tema,
    pregador: c.culto ? null : c.pregador,
    video: c.video,
  }));

  const ultimo = conteudos.at(-1)?.domingo;
  const futuras: ParteSerie[] = ultimo
    ? domingosDoMes(conteudos[0].domingo)
        .filter((domingo) => domingo > ultimo && domingo >= hoje)
        .map((_, i) => ({ parte: publicadas.length + i + 1, status: 'upcoming', data: null, titulo: null, pregador: null, video: null }))
    : [];

  const personalizado = tituloPersonalizado?.trim();
  return {
    serie: {
      titulo: personalizado || serie.titulo,
      tituloFonte: personalizado ? 'cms' : serie.tituloFonte,
      playlistId: serie.playlistId,
      playlistUrl: serie.playlistUrl,
    },
    atual: publicadas.at(-1) ?? null,
    partes: [...publicadas, ...futuras],
  };
}
