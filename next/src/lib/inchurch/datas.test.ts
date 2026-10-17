import type { EventoSite } from './eventos';
import { formatarDatasDoEvento } from './datas';

const evento = (ocorrencias: [string, string][]): EventoSite => ({
  id: 1,
  nome: 'Evento',
  ocorrencias: ocorrencias.map(([inicio, fim]) => ({ inicio: `${inicio}-03:00`, fim: `${fim}-03:00` })),
  imagem: null,
  descricao: null,
  link: null,
  destaque: false,
  igrejaId: null,
});

describe('formatarDatasDoEvento', () => {
  it('mostra dia e hora na ocorrência única', () => {
    expect(formatarDatasDoEvento(evento([['2026-10-14T20:00:00', '2026-10-14T21:00:00']]))).toEqual({
      destaques: '14 de Outubro\n20h',
      extra: null,
    });
    expect(formatarDatasDoEvento(evento([['2026-10-17T09:30:00', '2026-10-17T11:30:00']])).destaques).toBe('17 de Outubro\n9h30');
  });

  it('resume dias consecutivos do mesmo mês como intervalo', () => {
    const recorrente = evento(['05', '06', '07', '08', '09'].map((dia) => [`2026-10-${dia}T05:00:00`, `2026-10-${dia}T05:30:00`] as [string, string]));
    expect(formatarDatasDoEvento(recorrente)).toEqual({ destaques: '05 a 09 de Outubro\n5h', extra: null });
  });

  it('mantém as datas avulsas como informação complementar', () => {
    expect(formatarDatasDoEvento(evento([
      ['2026-10-09T20:00:00', '2026-10-09T20:30:00'],
      ['2026-11-06T20:00:00', '2026-11-06T20:30:00'],
    ]))).toEqual({ destaques: '09 de Outubro\n20h', extra: 'Também em 06 de Novembro' });
  });
});
