import { dataCurta, paraCampoDeData, ROTULOS_STATUS } from './formato';

describe('formato da área da equipe', () => {
  it('rótulos de status da API (1 pendente, 2 em andamento, 3 concluída)', () => {
    expect(ROTULOS_STATUS).toEqual({ 1: 'Pendente', 2: 'Em andamento', 3: 'Concluída' });
  });

  it.each([
    ['2026-01-10T12:00:00+00:00', '10/01/2026'],
    ['2024-01-01T00:00:00', '01/01/2024'],
    ['2026-11-01', '01/11/2026'],
  ])('dataCurta(%p) → %p (sem converter fuso: vale o dia escrito)', (iso, esperado) => {
    expect(dataCurta(iso)).toBe(esperado);
  });

  it.each(['', 'amanhã', '0001-01-01T00:00:00+00:00', undefined])('dataCurta de valor ausente ou inválido (%p) → "—"', (valor) => {
    expect(dataCurta(valor as string)).toBe('—');
  });

  it('paraCampoDeData devolve AAAA-MM-DD para o campo de data, ou vazio', () => {
    expect(paraCampoDeData('2026-11-01T00:00:00')).toBe('2026-11-01');
    expect(paraCampoDeData('lixo')).toBe('');
  });
});
