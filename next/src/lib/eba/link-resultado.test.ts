/** @jest-environment node */
import { assinarSessao } from './sessao';
import {
  emitirLinkResultado,
  lerLinkResultado,
  segredoDoResultado,
  VALIDADE_MAXIMA_LINK_MS,
} from './link-resultado';

const SEGREDO = 'segredo-do-resultado-com-mais-de-32-caracteres';
const OUTRO = 'outro-segredo-do-resultado-com-32-caracteres!';
const ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
const AGORA = Date.UTC(2026, 9, 22, 12, 0, 0);
const DIA = 86_400_000;

const emitir = (validadeMs = 7 * DIA, agora = AGORA, segredo = SEGREDO) =>
  emitirLinkResultado(ID, { segredo, validadeMs, agora });

describe('segredoDoResultado', () => {
  const original = process.env.EBA_RESULTADO_SEGREDO;
  afterEach(() => {
    if (original === undefined) delete process.env.EBA_RESULTADO_SEGREDO;
    else process.env.EBA_RESULTADO_SEGREDO = original;
  });

  it('ausente ou curto → null (a rota fica desligada)', () => {
    delete process.env.EBA_RESULTADO_SEGREDO;
    expect(segredoDoResultado()).toBeNull();
    process.env.EBA_RESULTADO_SEGREDO = 'curto';
    expect(segredoDoResultado()).toBeNull();
  });

  it('com 32+ caracteres → o segredo', () => {
    process.env.EBA_RESULTADO_SEGREDO = SEGREDO;
    expect(segredoDoResultado()).toBe(SEGREDO);
  });
});

describe('emitirLinkResultado / lerLinkResultado', () => {
  it('ida e volta devolve o id do aluno', () => {
    expect(lerLinkResultado(emitir(), SEGREDO, AGORA + DIA)).toEqual({ idStudent: ID });
  });

  it('o código é opaco: não contém o id nem deixa o id legível em base64', () => {
    const codigo = emitir();
    expect(codigo).not.toContain(ID);
    expect(codigo).toMatch(/^v1\.[A-Za-z0-9_-]+$/);
    const decodificado = Buffer.from(codigo.slice(3), 'base64url').toString('utf8');
    expect(decodificado).not.toContain(ID);
    expect(decodificado).not.toContain('idStudent');
  });

  it('dois códigos para o mesmo aluno são diferentes (iv aleatório)', () => {
    expect(emitir()).not.toBe(emitir());
  });

  it('adulterado em qualquer ponto → null', () => {
    const codigo = emitir();
    const corpo = Buffer.from(codigo.slice(3), 'base64url');
    for (const i of [0, 12, 20, corpo.length - 1]) {
      const copia = Buffer.from(corpo);
      copia[i] ^= 1;
      expect(lerLinkResultado(`v1.${copia.toString('base64url')}`, SEGREDO, AGORA)).toBeNull();
    }
  });

  it('truncado, vazio, sem versão ou lixo → null, sem lançar', () => {
    const codigo = emitir();
    for (const ruim of [codigo.slice(0, 20), '', 'v1.', 'v2.' + codigo.slice(3), codigo.slice(3), '%%%', 'a.b.c', undefined]) {
      expect(lerLinkResultado(ruim, SEGREDO, AGORA)).toBeNull();
    }
  });

  it('outro segredo → null', () => {
    expect(lerLinkResultado(emitir(), OUTRO, AGORA)).toBeNull();
  });

  it('segredo curto não emite nem lê', () => {
    expect(() => emitir(DIA, AGORA, 'curto')).toThrow();
    expect(lerLinkResultado(emitir(), 'curto', AGORA)).toBeNull();
  });

  it('vale até o fim da validade e depois expira', () => {
    const codigo = emitir(3 * DIA);
    expect(lerLinkResultado(codigo, SEGREDO, AGORA + 3 * DIA)).toEqual({ idStudent: ID });
    expect(lerLinkResultado(codigo, SEGREDO, AGORA + 3 * DIA + 1)).toBeNull();
  });

  it('emissão no futuro além da tolerância de 60 s → null', () => {
    const codigo = emitir(DIA, AGORA + 120_000);
    expect(lerLinkResultado(codigo, SEGREDO, AGORA)).toBeNull();
    expect(lerLinkResultado(emitir(DIA, AGORA + 30_000), SEGREDO, AGORA)).toEqual({ idStudent: ID });
  });

  it('validade inválida ou acima do teto na emissão → lança', () => {
    for (const ruim of [0, -1, Number.NaN, VALIDADE_MAXIMA_LINK_MS + 1]) {
      expect(() => emitir(ruim)).toThrow();
    }
    expect(lerLinkResultado(emitir(VALIDADE_MAXIMA_LINK_MS), SEGREDO, AGORA)).toEqual({ idStudent: ID });
  });

  it('o teto também vale na leitura (código emitido com validade maior, mesmo com o segredo certo)', () => {
    const codigo = emitirLinkResultado(ID, { segredo: SEGREDO, validadeMs: VALIDADE_MAXIMA_LINK_MS, agora: AGORA });
    expect(lerLinkResultado(codigo, SEGREDO, AGORA + VALIDADE_MAXIMA_LINK_MS + 1)).toBeNull();
  });

  it('id que não é UUID → lança na emissão', () => {
    expect(() => emitirLinkResultado('../Student', { segredo: SEGREDO, validadeMs: DIA, agora: AGORA })).toThrow();
  });

  it('o cookie de sessão do aluno não serve como código de resultado', () => {
    const sessao = assinarSessao({ idStudent: ID, idClass: 'turma', emailMascarado: 'a***@x.com', emitidoEm: AGORA }, SEGREDO);
    expect(lerLinkResultado(sessao, SEGREDO, AGORA)).toBeNull();
  });
});
