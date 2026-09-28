import { defineShowcase } from '@/lib/showcase/types';
import elePrometeu from '@/lib/youtube/__fixtures__/ele-prometeu.json';
import naoCompre from '@/lib/youtube/__fixtures__/nao-compre-essa-briga.json';
import { montarSerieAtual, normalizeSerie, type ConteudoDomingo, type SerieYoutube } from '@/lib/youtube/serie';
import type { YoutubePlaylistItem, YoutubeVideo } from '@/lib/youtube/types';
import mocks from './SerieAtualSection.mock.json';
import { normalizeSerieAtualConfig } from './normalize';
import { SerieAtual } from './SerieAtual';
import type { SerieAtualData, SerieAtualExemplo } from './types';

type Fixture = typeof naoCompre;

/** Resultado normalizado de uma fixture REAL da YouTube Data API (ver lib/youtube/__fixtures__). */
function doYoutube(fixture: Fixture, agora: string, ajustar?: (video: YoutubeVideo) => YoutubeVideo): SerieYoutube {
  const videos = (fixture.videos as YoutubeVideo[]).map((v) => (ajustar ? ajustar(v) : v));
  return normalizeSerie({
    playlist: { id: fixture.playlist.id, titulo: fixture.playlist.snippet.title },
    itens: fixture.itens as YoutubePlaylistItem[],
    videos,
    agora: new Date(agora),
  });
}

const LIVE_ID = naoCompre.itens[0].contentDetails.videoId;
const aoVivo = (v: YoutubeVideo): YoutubeVideo =>
  v.id === LIVE_ID
    ? { ...v, snippet: { ...v.snippet, liveBroadcastContent: 'live' }, liveStreamingDetails: { ...v.liveStreamingDetails, actualEndTime: undefined } }
    : v;

const completo = mocks.completo as SerieAtualData;
const minimo = mocks.minimo as SerieAtualData;

/** Troca o estado da parte mais recente (controle "Parte mais recente"). */
function comEstadoAtual(youtube: SerieYoutube, estado: string): SerieYoutube {
  const ultimo = youtube.conteudos.at(-1);
  if (!ultimo) return youtube;
  const novo: ConteudoDomingo =
    estado === 'published'
      ? {
          ...ultimo,
          status: 'published',
          culto: false,
          tema: ultimo.culto ? 'Tema da mensagem (exemplo)' : ultimo.tema,
          pregador: ultimo.culto ? 'Pr. Nome do Pregador' : ultimo.pregador,
        }
      : { ...ultimo, status: estado === 'live' ? 'live' : 'waiting-sermon-cut', culto: true, tema: null, pregador: null };
  return { ...youtube, conteudos: [...youtube.conteudos.slice(0, -1), novo], aoVivo: estado === 'live' };
}

export const serieAtualShowcase = defineShowcase<SerieAtualExemplo>({
  slug: 'serie-atual',
  nome: 'Série atual (mensagens)',
  categoria: 'secao',
  cmsKey: 'sections.serie-atual',
  descricao:
    'Série de mensagens do momento, montada sozinha a partir do YouTube da ADAI: nome da série, parte mais recente com player no site, as outras partes do mês e "Ao vivo agora" durante o culto. O Strapi só guarda configurações opcionais.',
  quandoUsar:
    'Na Home (depois de Pastores Líderes). Deixe os campos vazios para o automático; use título/playlist personalizados só para exceções.',
  doc: 'docs/componentes/serie-atual.md',
  figma: 'https://www.figma.com/design/cN5RwPRMA6zw5oLoeXidk7/adai.com.br?node-id=1-132',
  cms: (data) => data.strapi,
  render: ({ strapi, youtube, agora }) => {
    const config = normalizeSerieAtualConfig(strapi);
    if (!config.exibir) return null;
    const view = montarSerieAtual(youtube, { tituloPersonalizado: config.tituloPersonalizado, agora: new Date(agora) });
    return <SerieAtual view={view} index={1} id={strapi.id} />;
  },
  variantes: [
    {
      nome: 'completo',
      titulo: 'Playlist e título do CMS (5 domingos)',
      descricao: 'Como em /exemplos: "Playlist personalizada" = Ele Prometeu (agosto, 5 domingos) e "Título personalizado" preenchido. Dados reais do YouTube.',
      data: { strapi: completo, youtube: doYoutube(elePrometeu as Fixture, '2026-08-31T12:00:00-03:00'), agora: '2026-08-31T12:00:00-03:00' },
    },
    {
      nome: 'aguardando_corte',
      titulo: 'Culto terminou, corte não saiu (Home, 27/09)',
      descricao: 'Estado real de 27/09: "Culto ao vivo | ADAI On" encerrado na playlist → Parte 3 "Culto de hoje" com o culto completo.',
      data: { strapi: minimo, youtube: doYoutube(naoCompre, '2026-09-27T20:00:00-03:00'), agora: '2026-09-27T20:00:00-03:00' },
    },
    {
      nome: 'ao_vivo',
      titulo: 'Ao vivo agora',
      descricao: 'A mesma playlist com a live no ar: Parte 3 ao vivo, dentro da série (não vira série "Culto ao vivo").',
      data: { strapi: minimo, youtube: doYoutube(naoCompre, '2026-09-27T11:30:00-03:00', aoVivo), agora: '2026-09-27T11:30:00-03:00' },
    },
    {
      nome: 'proxima_parte',
      titulo: 'Com parte futura',
      descricao: 'Em 21/09 (antes do último domingo): Partes 1 e 2 publicadas e Parte 3 "Mensagem ainda não disponível".',
      data: {
        strapi: minimo,
        youtube: doYoutube({ ...naoCompre, itens: naoCompre.itens.slice(1), videos: naoCompre.videos.slice(1) }, '2026-09-21T10:00:00-03:00'),
        agora: '2026-09-21T10:00:00-03:00',
      },
    },
    {
      nome: 'minimo',
      titulo: 'Mínimo (tudo automático, 1 parte)',
      descricao: 'Campos do CMS vazios; série no 1º domingo de um mês com 5 domingos → 1 publicada + 4 futuras.',
      data: {
        strapi: minimo,
        youtube: doYoutube({ ...elePrometeu, itens: elePrometeu.itens.slice(-1), videos: elePrometeu.videos.slice(-1) } as Fixture, '2026-08-03T10:00:00-03:00'),
        agora: '2026-08-03T10:00:00-03:00',
      },
    },
    {
      nome: 'texto_longo',
      titulo: 'Título longo',
      descricao: 'Título personalizado com 60 caracteres (o limite do CMS).',
      data: { strapi: mocks.texto_longo as SerieAtualData, youtube: doYoutube(naoCompre, '2026-09-27T20:00:00-03:00'), agora: '2026-09-27T20:00:00-03:00' },
    },
  ],
  controles: [
    {
      id: 'estado',
      tipo: 'opcoes',
      rotulo: 'Parte mais recente',
      ajuda: 'Vem do YouTube: live no ar, culto encerrado sem corte, ou mensagem publicada.',
      opcoes: [
        { valor: 'published', rotulo: 'Mensagem publicada' },
        { valor: 'live', rotulo: 'Ao vivo' },
        { valor: 'waiting-sermon-cut', rotulo: 'Aguardando corte' },
      ],
      valor: (data) => data.youtube.conteudos.at(-1)?.status ?? 'published',
      aplicar: (data, valor) => ({ ...data, youtube: comEstadoAtual(data.youtube, valor) }),
    },
    {
      id: 'titulo',
      tipo: 'alternar',
      rotulo: 'Título personalizado (CMS)',
      ajuda: 'Desligado: nome identificado nos vídeos do YouTube.',
      valor: (data) => Boolean(data.strapi.titulo_personalizado?.trim()),
      aplicar: (data, ligado) => ({
        ...data,
        strapi: { ...data.strapi, titulo_personalizado: ligado ? data.strapi.titulo_personalizado || 'Título personalizado' : null },
      }),
    },
    {
      id: 'player',
      tipo: 'alternar',
      rotulo: 'Player no site',
      ajuda: 'Desligado simula vídeo que não permite incorporação: os botões abrem direto no YouTube.',
      valor: (data) => data.youtube.conteudos.every((c) => c.video.embeddable),
      aplicar: (data, ligado) => ({
        ...data,
        youtube: { ...data.youtube, conteudos: data.youtube.conteudos.map((c) => ({ ...c, video: { ...c.video, embeddable: ligado } })) },
      }),
    },
    {
      id: 'exibir',
      tipo: 'alternar',
      rotulo: 'Exibir seção (CMS)',
      valor: (data) => data.strapi.exibir !== false,
      aplicar: (data, ligado) => ({ ...data, strapi: { ...data.strapi, exibir: ligado } }),
    },
  ],
});
