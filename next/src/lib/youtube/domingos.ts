/**
 * Datas da série no fuso da igreja (America/Sao_Paulo). Dias são strings `YYYY-MM-DD`
 * (sem hora), para comparar e agrupar domingos sem depender do fuso do servidor.
 */

const TZ = 'America/Sao_Paulo';

const formatador = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  weekday: 'short',
  hour: '2-digit',
  hourCycle: 'h23',
});

const DIAS_SEMANA: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

interface DataLocal {
  dia: string;
  diaSemana: number;
  hora: number;
}

function emSaoPaulo(data: Date): DataLocal {
  const partes = Object.fromEntries(formatador.formatToParts(data).map((p) => [p.type, p.value]));
  return {
    dia: `${partes.year}-${partes.month}-${partes.day}`,
    diaSemana: DIAS_SEMANA[partes.weekday] ?? 0,
    hora: Number(partes.hour),
  };
}

function somarDias(dia: string, dias: number): string {
  const [ano, mes, d] = dia.split('-').map(Number);
  return new Date(Date.UTC(ano, mes - 1, d + dias)).toISOString().slice(0, 10);
}

/** Dia (`YYYY-MM-DD`) em São Paulo. */
export function diaEmSaoPaulo(data: Date): string {
  return emSaoPaulo(data).dia;
}

/** Domingo da semana da data (o próprio dia, se já for domingo). Corte publicado na segunda → domingo anterior. */
export function domingoDe(data: Date): string {
  const { dia, diaSemana } = emSaoPaulo(data);
  return somarDias(dia, -diaSemana);
}

/**
 * A data parece de um culto de domingo: domingo em São Paulo, ou segunda até 6h
 * (cortes publicados de madrugada, como "Ele Prometeu Paz" em 24/08 00:56).
 */
export function ehDomingoDeCulto(data: Date): boolean {
  const { diaSemana, hora } = emSaoPaulo(data);
  return diaSemana === 0 || (diaSemana === 1 && hora < 6);
}

/** Todos os domingos do mês do dia informado. */
export function domingosDoMes(dia: string): string[] {
  const [ano, mes] = dia.split('-').map(Number);
  const primeiro = `${ano}-${String(mes).padStart(2, '0')}-01`;
  const semana = new Date(Date.UTC(ano, mes - 1, 1)).getUTCDay();
  const domingos: string[] = [];
  for (let atual = somarDias(primeiro, (7 - semana) % 7); Number(atual.slice(5, 7)) === mes; atual = somarDias(atual, 7)) {
    domingos.push(atual);
  }
  return domingos;
}

/** "07 de Junho" (formato do Figma). */
export function formatarDia(dia: string): string {
  const [, mes, d] = dia.split('-').map(Number);
  return `${String(d).padStart(2, '0')} de ${MESES[mes - 1]}`;
}

/** Converte um ISO da API em Date, ou null se inválido. */
export function lerData(iso: string | undefined | null): Date | null {
  if (!iso) return null;
  const data = new Date(iso);
  return Number.isNaN(data.getTime()) ? null : data;
}
