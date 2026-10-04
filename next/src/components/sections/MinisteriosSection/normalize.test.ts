import mocks from './MinisteriosSection.mock.json';
import { normalizeMinisterios } from './normalize';
import type { MinisteriosData } from './types';

const completo = mocks.completo as MinisteriosData;

describe('normalizeMinisterios — exibição', () => {
  it('lista por padrão (Home); cards quando pedido; valor desconhecido vira lista', () => {
    expect(normalizeMinisterios(completo)?.exibicao).toBe('lista');
    expect(normalizeMinisterios({ ...completo, exibicao: 'cards' })?.exibicao).toBe('cards');
    expect(normalizeMinisterios({ ...completo, exibicao: 'grade' as never })?.exibicao).toBe('lista');
  });
});
