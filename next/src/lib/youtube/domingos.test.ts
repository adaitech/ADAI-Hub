import { domingoDe, domingosDoMes, ehDomingoDeCulto, formatarDia } from './domingos';

describe('domingos (America/Sao_Paulo)', () => {
  it('conta os domingos do mês (não fixa 4)', () => {
    expect(domingosDoMes('2026-06-15')).toEqual(['2026-06-07', '2026-06-14', '2026-06-21', '2026-06-28']);
    expect(domingosDoMes('2026-08-01')).toEqual(['2026-08-02', '2026-08-09', '2026-08-16', '2026-08-23', '2026-08-30']);
    expect(domingosDoMes('2026-11-30')).toHaveLength(5);
  });

  it('domingo da semana usa o fuso de São Paulo, não o do servidor', () => {
    // Segunda 00:56 em Brasília = 03:56 UTC: ainda é o culto do domingo anterior.
    expect(domingoDe(new Date('2026-08-24T03:56:00Z'))).toBe('2026-08-23');
    // Sábado 22:09 em Brasília = domingo 01:09 UTC: é sábado na igreja.
    expect(domingoDe(new Date('2026-08-09T01:09:00Z'))).toBe('2026-08-02');
    expect(domingoDe(new Date('2026-09-27T14:21:00Z'))).toBe('2026-09-27');
  });

  it('culto de domingo: domingo ou segunda de madrugada; sábado não', () => {
    expect(ehDomingoDeCulto(new Date('2026-09-20T16:19:00Z'))).toBe(true);
    expect(ehDomingoDeCulto(new Date('2026-08-24T03:56:00Z'))).toBe(true);
    expect(ehDomingoDeCulto(new Date('2026-08-09T01:09:00Z'))).toBe(false);
    expect(ehDomingoDeCulto(new Date('2026-07-25T23:43:00Z'))).toBe(false);
  });

  it('formata como no Figma', () => {
    expect(formatarDia('2026-06-07')).toBe('07 de Junho');
  });
});
