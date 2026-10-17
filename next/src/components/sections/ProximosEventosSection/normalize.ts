import type { CardData, CarrosselCardsData } from '@/components/sections/CarrosselCardsSection/types';
import { CORES_CARD } from '@/components/sections/CarrosselCardsSection/types';
import { formatarDatasDoEvento as datasDoEvento } from '@/lib/inchurch/datas';
import { eventosDaAgenda, idIgrejaValido, igrejasDoEvento, proximosEventos, type EventoSite, type EventosInchurch } from '@/lib/inchurch/eventos';
import { urlDoEvento } from '@/lib/inchurch/detalhes';
import type { ProximosEventosData } from './types';

export const QUANTIDADE_PADRAO = 8;
export const TITULO_PADRAO = 'Próximos eventos';

export { datasDoEvento };

function paraCard(evento: EventoSite, cor: CardData['cor']): CardData {
  const { destaques, extra } = datasDoEvento(evento);
  return {
    id: evento.id,
    url: urlDoEvento(evento),
    cor,
    // Arte de divulgação: o nome do evento já está no título do card → imagem decorativa (alt vazio).
    imagem: evento.imagem ? { id: evento.id, url: evento.imagem.url, alternativeText: '', width: evento.imagem.width, height: evento.imagem.height } : null,
    titulo: evento.nome,
    destaques,
    texto: [extra, evento.descricao].filter(Boolean).join('\n') || null,
    link: evento.link ? { id: evento.id, texto: evento.link.texto, url: evento.link.url, nova_aba: true } : null,
  };
}

export function quantidadeDe(data: ProximosEventosData): number {
  const n = Math.trunc(Number(data.quantidade));
  return Number.isFinite(n) && n >= 1 ? Math.min(n, 12) : QUANTIDADE_PADRAO;
}

/** ID da igreja na inChurch da Unidade escolhida; vazio ou inválido → `null` (agenda sem filtro). */
export function igrejaDe(data: ProximosEventosData): number | null {
  return idIgrejaValido(data.unidade?.igreja_inchurch_id);
}

/**
 * Configuração do Strapi + eventos da inChurch → JSON do Carrossel de cards
 * (o mesmo componente e o mesmo card das outras seções, com arte 16:9 colorida logo após o título).
 */
export function paraCarrossel(data: ProximosEventosData, eventos: EventoSite[], detalhes = false): CarrosselCardsData {
  const cor = data.cor_cards && CORES_CARD.includes(data.cor_cards) ? data.cor_cards : 'cinza';
  return {
    __component: 'sections.carrossel-cards',
    id: data.id,
    titulo: data.titulo?.trim() || TITULO_PADRAO,
    texto_apoio: data.texto_apoio,
    cards: eventos.map((evento) => ({ ...paraCard(evento, cor), ...(detalhes ? { link: null } : {}) })),
    estilo_imagem: 'arte',
    posicao_imagem: 'apos_titulo',
    link: data.link,
  };
}

export function selecionarEventos(data: ProximosEventosData, dados: EventosInchurch, opcoes: { excluirId?: number; priorizarIgrejaId?: number | null; agora?: Date; ordemCronologica?: boolean } = {}) {
  const candidatos = { ...dados, eventos: dados.eventos.filter((evento) => evento.id !== opcoes.excluirId) };
  if (opcoes.ordemCronologica) return eventosDaAgenda(candidatos, { agora: opcoes.agora }).slice(0, Math.min(3, quantidadeDe(data)));
  return proximosEventos(candidatos, { agora: opcoes.agora, limite: Number.MAX_SAFE_INTEGER, igrejaId: igrejaDe(data) })
    .sort((a, b) => opcoes.priorizarIgrejaId ? Number(igrejasDoEvento(b).includes(opcoes.priorizarIgrejaId)) - Number(igrejasDoEvento(a).includes(opcoes.priorizarIgrejaId)) : 0)
    .slice(0, quantidadeDe(data));
}
