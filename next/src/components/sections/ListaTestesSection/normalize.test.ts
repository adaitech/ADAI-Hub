import { normalizeListaTestes } from './normalize';
import mocks from './ListaTestesSection.mock.json';
import type { ListaTestesData } from './types';

const completo = mocks.completo as ListaTestesData;

describe('normalizeListaTestes', () => {
  it('título, apoio e atalhos ligados', () => {
    expect(normalizeListaTestes(completo)).toEqual({
      titulo: 'Os 5 testes',
      textoApoio: 'Na ordem em que aparecem no curso. Você pode ir direto a um deles:',
      atalhos: true,
    });
  });

  it('atalhos ligados por padrão; só desligados com false', () => {
    expect(normalizeListaTestes({ ...completo, mostrar_atalhos: null })?.atalhos).toBe(true);
    expect(normalizeListaTestes({ ...completo, mostrar_atalhos: false })?.atalhos).toBe(false);
  });

  it('apoio vazio some; sem título → null', () => {
    expect(normalizeListaTestes({ ...completo, texto_apoio: '  ' })).not.toHaveProperty('textoApoio');
    expect(normalizeListaTestes({ ...completo, titulo: ' ' })).toBeNull();
  });
});
