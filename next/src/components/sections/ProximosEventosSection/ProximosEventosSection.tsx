import { CarrosselCardsSection } from '@/components/sections/CarrosselCardsSection';
import { getEventosInchurch } from '@/lib/inchurch/eventos-cache';
import { proximosEventos } from '@/lib/inchurch/eventos';
import type { SectionProps } from '@/types/sections';
import { paraCarrossel, quantidadeDe } from './normalize';
import type { ProximosEventosData } from './types';

/**
 * Figma: Próximos eventos (node 1:173). Server Component: Strapi = título/quantidade/cor;
 * inChurch = eventos. Renderiza com o mesmo Carrossel de cards (cards com arte 16:9).
 * inChurch fora e sem cache anterior, ou nenhum evento futuro → a seção não aparece.
 */
export async function ProximosEventosSection({ data, index }: SectionProps<ProximosEventosData>) {
  const dados = await getEventosInchurch();
  if (!dados) return null;

  const eventos = proximosEventos(dados, { limite: quantidadeDe(data) });
  if (eventos.length === 0) return null;

  return <CarrosselCardsSection data={paraCarrossel(data, eventos)} index={index} secao="proximos-eventos" />;
}
