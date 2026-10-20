import { criarLimitador } from './limite';

const MINUTO = 60_000;

describe('criarLimitador', () => {
  it('permite 10 tentativas, nega a 11ª no mesmo minuto e libera depois da janela', () => {
    const permitir = criarLimitador(10, MINUTO);
    const t0 = 1_000_000;
    for (let i = 0; i < 10; i++) expect(permitir('1.1.1.1', t0 + i)).toBe(true);
    expect(permitir('1.1.1.1', t0 + 20)).toBe(false);
    expect(permitir('1.1.1.1', t0 + MINUTO + 20)).toBe(true);
  });

  it('conta cada chave separadamente', () => {
    const permitir = criarLimitador(1, MINUTO);
    expect(permitir('a', 0)).toBe(true);
    expect(permitir('a', 1)).toBe(false);
    expect(permitir('b', 1)).toBe(true);
  });

  it('não conta tentativas negadas como novas (a janela anda só com as permitidas)', () => {
    const permitir = criarLimitador(1, MINUTO);
    expect(permitir('a', 0)).toBe(true);
    expect(permitir('a', MINUTO - 1)).toBe(false);
    expect(permitir('a', MINUTO + 1)).toBe(true);
  });

  it('descarta as tentativas vencidas da chave ao conferi-la', () => {
    const permitir = criarLimitador(2, MINUTO);
    expect(permitir('a', 0)).toBe(true);
    expect(permitir('a', 10)).toBe(true);
    expect(permitir('a', 20)).toBe(false);
    // só a tentativa de t=0 venceu: sobra uma vaga
    expect(permitir('a', MINUTO + 5)).toBe(true);
    expect(permitir('a', MINUTO + 6)).toBe(false);
  });

  it('remove a chave mais antiga quando passa do limite de chaves', () => {
    const permitir = criarLimitador(1, MINUTO, 2);
    expect(permitir('a', 0)).toBe(true);
    expect(permitir('b', 1)).toBe(true);
    expect(permitir('c', 2)).toBe(true); // 'a' (a mais antiga) é descartada
    expect(permitir('b', 3)).toBe(false);
    expect(permitir('a', 4)).toBe(true); // esquecida, começa do zero
  });
});
