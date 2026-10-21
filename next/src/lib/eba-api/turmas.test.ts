/** @jest-environment node */
import classes from './__fixtures__/classes.json';
import { ebaFetch } from './client';
import { aquecerApi, turmasAtivas } from './turmas';

jest.mock('./client');
const ebaFetchMock = jest.mocked(ebaFetch);

describe('turmasAtivas', () => {
  beforeEach(() => ebaFetchMock.mockReset());

  it('pede ClassEBA?page-size=100 com cache de 600 s e tag eba-testes', async () => {
    ebaFetchMock.mockResolvedValue(classes);
    await turmasAtivas();
    expect(ebaFetchMock).toHaveBeenCalledWith('ClassEBA?page-size=100', {
      cache: { revalidate: 600, tags: ['eba-testes'] },
    });
  });

  it('repassa timeoutMs ao ebaFetch, com o mesmo cache', async () => {
    ebaFetchMock.mockResolvedValue(classes);
    await turmasAtivas({ timeoutMs: 45_000 });
    expect(ebaFetchMock).toHaveBeenCalledWith('ClassEBA?page-size=100', {
      cache: { revalidate: 600, tags: ['eba-testes'] },
      timeoutMs: 45_000,
    });
  });

  it('devolve só id e nome, sem turmas concluídas (codStatus 3)', async () => {
    ebaFetchMock.mockResolvedValue(classes);
    const turmas = await turmasAtivas();
    const ativas = classes.data.filter((c) => c.codStatus !== 3);
    expect(turmas).toHaveLength(ativas.length);
    expect(turmas.every((t) => Object.keys(t).sort().join() === 'id,nome')).toBe(true);
    expect(turmas.map((t) => t.nome)).not.toContain('DNA 01');
  });

  it('ordena por nome em pt-BR', async () => {
    const base = classes.data[0];
    ebaFetchMock.mockResolvedValue({
      ...classes,
      data: [
        { ...base, id: 'c', name: 'Zeta', codStatus: 2 },
        { ...base, id: 'a', name: 'Álamo', codStatus: 1 },
        { ...base, id: 'b', name: 'Beta', codStatus: 2 },
      ],
    });
    expect((await turmasAtivas()).map((t) => t.nome)).toEqual(['Álamo', 'Beta', 'Zeta']);
  });
});

describe('aquecerApi', () => {
  beforeEach(() => ebaFetchMock.mockReset());

  it('faz um GET leve (ClassEBA?page-size=1) sem cache, com o timeout pedido, e não devolve dados', async () => {
    ebaFetchMock.mockResolvedValue(classes);
    await expect(aquecerApi({ timeoutMs: 45_000 })).resolves.toBeUndefined();
    expect(ebaFetchMock).toHaveBeenCalledWith('ClassEBA?page-size=1', { timeoutMs: 45_000 });
    expect(ebaFetchMock.mock.calls[0][1]).not.toHaveProperty('cache');
  });

  it('sem opção, usa o timeout curto do aquecimento (8 s): não precisa esperar a resposta', async () => {
    ebaFetchMock.mockResolvedValue(classes);
    await aquecerApi();
    expect(ebaFetchMock).toHaveBeenCalledWith('ClassEBA?page-size=1', { timeoutMs: 8_000 });
  });

  it('propaga o erro (quem chama decide ignorar)', async () => {
    const erro = new Error('x');
    ebaFetchMock.mockRejectedValue(erro);
    await expect(aquecerApi()).rejects.toBe(erro);
  });
});
