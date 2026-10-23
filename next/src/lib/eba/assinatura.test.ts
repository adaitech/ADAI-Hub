import { assinarJson, lerJsonAssinado } from './assinatura';

const SEGREDO = 'segredo-de-teste-com-mais-de-32-caracteres';

describe('assinarJson / lerJsonAssinado', () => {
  it('lê de volta o que assinou', () => {
    expect(lerJsonAssinado(assinarJson({ a: 1, b: 'x' }, SEGREDO), SEGREDO)).toEqual({ a: 1, b: 'x' });
  });

  it.each([
    ['vazio', undefined],
    ['sem ponto', 'abc'],
    ['três partes', 'a.b.c'],
    ['assinatura trocada', `${assinarJson({ a: 1 }, SEGREDO).split('.')[0]}.xyz`],
  ])('recusa valor %s', (_n, valor) => {
    expect(lerJsonAssinado(valor, SEGREDO)).toBeNull();
  });

  it('recusa com outro segredo e com segredo curto', () => {
    const valor = assinarJson({ a: 1 }, SEGREDO);
    expect(lerJsonAssinado(valor, `${SEGREDO}-outro`)).toBeNull();
    expect(lerJsonAssinado(valor, 'curto')).toBeNull();
    expect(() => assinarJson({ a: 1 }, 'curto')).toThrow();
  });
});
