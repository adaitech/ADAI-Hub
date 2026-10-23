import { randomInt } from 'node:crypto';
import { gerarCodigo, hashDoCodigo, hashDoEmail, soDigitos, VALIDADE_CODIGO_MS } from './verificacao';

jest.mock('node:crypto', () => ({ ...jest.requireActual('node:crypto'), randomInt: jest.fn(jest.requireActual('node:crypto').randomInt) }));

const SEGREDO = 'segredo-de-teste-com-mais-de-32-caracteres';

describe('gerarCodigo', () => {
  it('sempre 6 dígitos, com zeros à esquerda', () => {
    jest.mocked(randomInt).mockReturnValueOnce(42 as never);
    expect(gerarCodigo()).toBe('000042');
    for (let i = 0; i < 50; i++) expect(gerarCodigo()).toMatch(/^\d{6}$/);
    expect(randomInt).toHaveBeenCalledWith(0, 1_000_000);
  });

  it('vale 10 minutos', () => {
    expect(VALIDADE_CODIGO_MS).toBe(600_000);
  });
});

describe('hashDoEmail', () => {
  it('normaliza o e-mail (maiúsculas e espaços) e não revela o e-mail', () => {
    const h = hashDoEmail('  Ana@X.com ', SEGREDO);
    expect(h).toBe(hashDoEmail('ana@x.com', SEGREDO));
    expect(h).not.toContain('ana');
    expect(h.length).toBeLessThanOrEqual(100);
  });

  it('depende do segredo', () => {
    expect(hashDoEmail('ana@x.com', SEGREDO)).not.toBe(hashDoEmail('ana@x.com', `${SEGREDO}-outro`));
  });
});

describe('hashDoCodigo', () => {
  it('o mesmo código em e-mails diferentes tem hashes diferentes', () => {
    const a = hashDoEmail('ana@x.com', SEGREDO);
    const b = hashDoEmail('alice@x.com', SEGREDO);
    expect(hashDoCodigo(a, '123456', SEGREDO)).not.toBe(hashDoCodigo(b, '123456', SEGREDO));
    expect(hashDoCodigo(a, '123456', SEGREDO)).toBe(hashDoCodigo(a, '123456', SEGREDO));
  });
});

describe('soDigitos', () => {
  it.each([
    ['123456', '123456'],
    ['123 456', '123456'],
    [' 123-456\n', '123456'],
    ['12345', null],
    ['1234567', null],
    ['12a456', null],
    ['', null],
  ])('%j → %j', (entrada, esperado) => {
    expect(soDigitos(entrada)).toBe(esperado);
  });

  it('valor que não é texto → null', () => {
    expect(soDigitos(123456 as unknown as string)).toBeNull();
  });
});
