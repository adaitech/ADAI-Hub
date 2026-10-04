import type { CardData, CarrosselCardsData } from '@/components/sections/CarrosselCardsSection/types';
import { CORES_CARD } from '@/components/sections/CarrosselCardsSection/types';
import { idIgrejaValido, type EventoSite } from '@/lib/inchurch/eventos';
import { formatarDia } from '@/lib/youtube/domingos';
import type { ProximosEventosData } from './types';

export const QUANTIDADE_PADRAO = 8;
export const TITULO_PADRAO = 'Próximos eventos';

/** "20h" / "9h30" a partir de `2026-10-14T20:00:00-03:00` (horário da igreja). */
function hora(iso: string): string {
  const [h, m] = iso.slice(11, 16).split(':').map(Number);
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}

const dia = (iso: string) => iso.slice(0, 10);
const somarUmDia = (d: string) => new Date(Date.parse(`${d}T12:00:00Z`) + 86_400_000).toISOString().slice(0, 10);

/**
 * Datas do card, no tom do Figma ("Jun / 20" → "20 de Junho"):
 * - uma data: "14 de Outubro" · "20h";
 * - dias seguidos no mesmo mês (Semana de Jejum, conferência de 2 dias): "05 a 09 de Outubro" · "5h";
 * - datas soltas: a próxima + "Também em 06 de Novembro".
 */
export function datasDoEvento(evento: EventoSite): { destaques: string; extra: string | null } {
  const [primeira] = evento.ocorrencias;
  const dias = [...new Set(evento.ocorrencias.flatMap((o) => (dia(o.fim) > dia(o.inicio) ? [dia(o.inicio), dia(o.fim)] : [dia(o.inicio)])))].sort();
  const seguidos = dias.every((d, i) => i === 0 || somarUmDia(dias[i - 1]) === d);
  const mesmoMes = dias.every((d) => d.slice(0, 7) === dias[0].slice(0, 7));

  if (dias.length > 1 && seguidos && mesmoMes) {
    const [inicio, fim] = [formatarDia(dias[0]), formatarDia(dias.at(-1)!)];
    return { destaques: `${inicio.slice(0, 2)} a ${fim}\n${hora(primeira.inicio)}`, extra: null };
  }
  const outras = evento.ocorrencias.slice(1).map((o) => formatarDia(dia(o.inicio)));
  return {
    destaques: `${formatarDia(dia(primeira.inicio))}\n${hora(primeira.inicio)}`,
    extra: outras.length ? `Também em ${outras.slice(0, 3).join(', ')}${outras.length > 3 ? '…' : ''}` : null,
  };
}

function paraCard(evento: EventoSite, cor: CardData['cor']): CardData {
  const { destaques, extra } = datasDoEvento(evento);
  return {
    id: evento.id,
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
export function paraCarrossel(data: ProximosEventosData, eventos: EventoSite[]): CarrosselCardsData {
  const cor = data.cor_cards && CORES_CARD.includes(data.cor_cards) ? data.cor_cards : 'cinza';
  return {
    __component: 'sections.carrossel-cards',
    id: data.id,
    titulo: data.titulo?.trim() || TITULO_PADRAO,
    texto_apoio: data.texto_apoio,
    cards: eventos.map((evento) => paraCard(evento, cor)),
    estilo_imagem: 'arte',
    posicao_imagem: 'apos_titulo',
    link: data.link,
  };
}
