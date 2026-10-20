import type { EventoSite } from './eventos';
import { formatarDia } from '@/lib/youtube/domingos';

/** "20h" / "9h30" a partir de `2026-10-14T20:00:00-03:00` (horário da igreja). */
function hora(iso: string): string {
  const [h, m] = iso.slice(11, 16).split(':').map(Number);
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}

const dia = (iso: string) => iso.slice(0, 10);
const somarUmDia = (data: string) => new Date(Date.parse(`${data}T12:00:00Z`) + 86_400_000).toISOString().slice(0, 10);

/**
 * Datas exibidas nos cards de evento:
 * - uma data: "14 de Outubro" · "20h";
 * - dias seguidos no mesmo mês: "05 a 09 de Outubro" · "5h";
 * - datas soltas: a próxima + "Também em 06 de Novembro".
 */
export function formatarDatasDoEvento(evento: EventoSite): { destaques: string; extra: string | null } {
  const [primeira] = evento.ocorrencias;
  const dias = [...new Set(evento.ocorrencias.flatMap((ocorrencia) => (dia(ocorrencia.fim) > dia(ocorrencia.inicio) ? [dia(ocorrencia.inicio), dia(ocorrencia.fim)] : [dia(ocorrencia.inicio)])))].sort();
  const seguidos = dias.every((data, indice) => indice === 0 || somarUmDia(dias[indice - 1]) === data);
  const mesmoMes = dias.every((data) => data.slice(0, 7) === dias[0].slice(0, 7));

  if (dias.length > 1 && seguidos && mesmoMes) {
    const [inicio, fim] = [formatarDia(dias[0]), formatarDia(dias.at(-1)!)];
    return { destaques: `${inicio.slice(0, 2)} a ${fim}\n${hora(primeira.inicio)}`, extra: null };
  }

  const outras = evento.ocorrencias.slice(1).map((ocorrencia) => formatarDia(dia(ocorrencia.inicio)));
  return {
    destaques: `${formatarDia(dia(primeira.inicio))}\n${hora(primeira.inicio)}`,
    extra: outras.length ? `Também em ${outras.slice(0, 3).join(', ')}${outras.length > 3 ? '…' : ''}` : null,
  };
}
