/** @jest-environment node */
import { abrirSelo, selar } from './selo';

const SEGREDO = 'segredo-do-selo-com-mais-de-32-caracteres!!';
const OUTRO = 'outro-segredo-do-selo-com-32-caracteres!!';

describe('selo (AES-256-GCM)', () => {
  it('ida e volta devolve os dados', () => {
    const dados = { a: 1, texto: 'olá' };
    expect(abrirSelo(selar(dados, SEGREDO, 'teste'), SEGREDO, 'teste')).toEqual(dados);
  });

  it('opaco: não contém os dados nem os deixa legíveis em base64', () => {
    const valor = selar({ idStudent: 'abc-123', token: 'segredo-do-token' }, SEGREDO, 'teste');
    expect(valor).toMatch(/^v1\.[A-Za-z0-9_-]+$/);
    const aberto = Buffer.from(valor.slice(3), 'base64url').toString('utf8');
    for (const texto of [valor, aberto]) {
      expect(texto).not.toContain('abc-123');
      expect(texto).not.toContain('segredo-do-token');
    }
  });

  it('dois selos dos mesmos dados são diferentes (iv aleatório)', () => {
    expect(selar({ a: 1 }, SEGREDO, 'teste')).not.toBe(selar({ a: 1 }, SEGREDO, 'teste'));
  });

  it('outro uso (finalidade) não abre: o selo de um recurso não vale em outro', () => {
    expect(abrirSelo(selar({ a: 1 }, SEGREDO, 'resultado'), SEGREDO, 'equipe')).toBeNull();
  });

  it('outro segredo, segredo curto, adulterado, truncado, sem versão ou lixo → null, sem lançar', () => {
    const valor = selar({ a: 1 }, SEGREDO, 'teste');
    expect(abrirSelo(valor, OUTRO, 'teste')).toBeNull();
    expect(abrirSelo(valor, 'curto', 'teste')).toBeNull();
    const corpo = Buffer.from(valor.slice(3), 'base64url');
    corpo[corpo.length - 1] ^= 1;
    expect(abrirSelo(`v1.${corpo.toString('base64url')}`, SEGREDO, 'teste')).toBeNull();
    for (const ruim of [valor.slice(0, 20), '', 'v1.', 'v2.' + valor.slice(3), valor.slice(3), '%%%', undefined]) {
      expect(abrirSelo(ruim, SEGREDO, 'teste')).toBeNull();
    }
  });

  it('segredo curto não sela', () => {
    expect(() => selar({ a: 1 }, 'curto', 'teste')).toThrow();
  });
});
