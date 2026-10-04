import { CarrosselCardsSection } from '@/components/sections/CarrosselCardsSection';
import { getEventosInchurch } from '@/lib/inchurch/eventos-cache';
import { proximosEventos } from '@/lib/inchurch/eventos';
import { getIgrejasInchurch } from '@/lib/strapi/queries/unidades';
import type { SectionProps } from '@/types/sections';
import { igrejaDe, paraCarrossel, quantidadeDe } from './normalize';
import type { ProximosEventosData } from './types';

/**
 * Figma: Próximos eventos (node 1:173). Server Component: Strapi = título/quantidade/cor;
 * inChurch = eventos. Renderiza com o mesmo Carrossel de cards (arte 16:9 logo após o título).
 * Com Unidade (página da unidade): eventos da igreja dela na inChurch + eventos gerais.
 * inChurch fora e sem cache anterior, ou nenhum evento futuro → a seção não aparece.
 */
export async function ProximosEventosSection({ data, index }: SectionProps<ProximosEventosData>) {
  const igrejaId = igrejaDe(data);
  // Todas as igrejas cadastradas: é preciso conhecer as outras para tirar os eventos delas.
  const igrejas = [...(await getIgrejasInchurch()), ...(igrejaId ? [igrejaId] : [])];
  const dados = await getEventosInchurch([...new Set(igrejas)].sort((a, b) => a - b));
  if (!dados) return null;

  const eventos = proximosEventos(dados, { limite: quantidadeDe(data), igrejaId });
  if (eventos.length === 0) return null;

  return <CarrosselCardsSection data={paraCarrossel(data, eventos)} index={index} secao="proximos-eventos" />;
}
