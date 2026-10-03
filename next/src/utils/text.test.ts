import { splitLines } from './text';

describe('splitLines', () => {
  it('quebra por Enter, tira espaços e linhas vazias', () => {
    expect(splitLines('Amar.\n  Servir.  \n\n Influenciar.\n')).toEqual(['Amar.', 'Servir.', 'Influenciar.']);
  });

  it('Enter do Windows (\\r\\n) não deixa "\\r" no texto', () => {
    expect(splitLines('Amar.\r\nServir.')).toEqual(['Amar.', 'Servir.']);
  });

  it('vazio, null ou undefined → lista vazia', () => {
    expect(splitLines('')).toEqual([]);
    expect(splitLines(null)).toEqual([]);
    expect(splitLines(undefined)).toEqual([]);
  });
});
