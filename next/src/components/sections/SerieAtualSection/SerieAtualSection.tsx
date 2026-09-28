import { getSerieAtual } from '@/lib/youtube/serie-atual';
import { montarSerieAtual } from '@/lib/youtube/serie';
import type { SectionProps } from '@/types/sections';
import { normalizeSerieAtualConfig } from './normalize';
import { SerieAtual } from './SerieAtual';
import type { SerieAtualData } from './types';

const avisadas = new Set<string>();

/**
 * Seção "Série atual" (Server Component). Strapi = configuração editorial; YouTube = conteúdo.
 * Busca e cache ficam em `lib/youtube/serie-atual.ts`; aqui só: config → dados → view model → UI.
 * YouTube fora e sem cache anterior → a seção não aparece (a página continua de pé).
 */
export async function SerieAtualSection({ data, index }: SectionProps<SerieAtualData>) {
  const config = normalizeSerieAtualConfig(data);
  if (!config.exibir) return null;

  if (config.playlistUrlInvalida && !avisadas.has(String(data.playlist_url))) {
    avisadas.add(String(data.playlist_url));
    console.warn(`[serie-atual] "Playlist personalizada" não é um link de playlist do YouTube: usando a série mais recente.`);
  }

  const serie = await getSerieAtual(config.playlistId);
  if (!serie) return null;

  const view = montarSerieAtual(serie, { tituloPersonalizado: config.tituloPersonalizado });
  return <SerieAtual view={view} index={index} id={data.id} />;
}
