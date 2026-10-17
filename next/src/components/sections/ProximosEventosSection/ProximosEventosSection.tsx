import { CarrosselCardsSection } from '@/components/sections/CarrosselCardsSection';
import { getEventosInchurch } from '@/lib/inchurch/eventos-cache';
import type { EventosInchurch } from '@/lib/inchurch/eventos';
import { getIgrejasInchurch } from '@/lib/strapi/queries/unidades';
import type { SectionProps } from '@/types/sections';
import { igrejaDe, paraCarrossel, selecionarEventos } from './normalize';
import type { ProximosEventosData } from './types';

/**
 * Figma: Próximos eventos (node 1:173). Server Component: Strapi = título/quantidade/cor;
 * inChurch = eventos. Renderiza com o mesmo Carrossel de cards (arte 16:9 logo após o título).
 * Com Unidade (página da unidade): eventos da igreja dela na inChurch + eventos gerais.
 * inChurch fora e sem cache anterior, ou nenhum evento futuro → a seção não aparece.
 */
export async function ProximosEventosSection({ data, index, eventosExternos, excluirId, priorizarIgrejaId, detalhes = false }: SectionProps<ProximosEventosData> & {
  eventosExternos?: EventosInchurch; excluirId?: number; priorizarIgrejaId?: number | null; detalhes?: boolean;
}) {
  const igrejaId = igrejaDe(data);
  // Todas as igrejas cadastradas: é preciso conhecer as outras para tirar os eventos delas.
  const igrejas = eventosExternos ? [] : [...(await getIgrejasInchurch()), ...(igrejaId ? [igrejaId] : [])];
  const dados = eventosExternos ?? await getEventosInchurch([...new Set(igrejas)].sort((a, b) => a - b));
  if (!dados) return null;

  const eventos = selecionarEventos(data, dados, { excluirId, priorizarIgrejaId, ordemCronologica: detalhes });
  if (eventos.length === 0) return null;

  const cards = paraCarrossel(data, eventos, detalhes);
  return <CarrosselCardsSection data={cards} index={index} secao="proximos-eventos" colunasDesktop={detalhes ? 3 : undefined} />;
}
