/** Formatadores da área da equipe. Datas da API vêm como `AAAA-MM-DDTHH:mm:ss`: vale o dia escrito (sem fuso). */

export const ROTULOS_STATUS = { 1: 'Pendente', 2: 'Em andamento', 3: 'Concluída' } as const;

const DIA = /^(\d{4})-(\d{2})-(\d{2})/;

/** `2026-01-10T12:00:00` → `10/01/2026`. Vazio, inválido ou a data zero da API (`0001-01-01`) → `—`. */
export function dataCurta(iso: string | undefined): string {
  const m = DIA.exec(iso ?? '');
  if (!m || m[1] === '0001') return '—';
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/** Valor para `<input type="date">`: `AAAA-MM-DD`, ou vazio. */
export function paraCampoDeData(iso: string | undefined): string {
  const m = DIA.exec(iso ?? '');
  return m && m[1] !== '0001' ? `${m[1]}-${m[2]}-${m[3]}` : '';
}
