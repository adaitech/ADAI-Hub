/** @jest-environment node */
import classes from './__fixtures__/classes.json';
import login from './__fixtures__/login-ok.json';
import pagina from './__fixtures__/students-pagina.json';
import { ebaFetch, EbaApiError, EbaApiIndisponivel } from './client';
import {
  alunoDaEquipe,
  apagarTurma,
  buscarAlunos,
  criarTurma,
  CredenciaisInvalidas,
  editarTurma,
  entrar,
  listarAlunos,
  listarTurmas,
  SessaoEncerrada,
} from './equipe';

jest.mock('./client', () => ({ ...jest.requireActual('./client'), ebaFetch: jest.fn() }));
const ebaFetchMock = jest.mocked(ebaFetch);

const TOKEN = 'bearer-da-equipe';
const ID = '11111111-2222-4333-8444-555555555555';
const TURMA = '63904477-46a9-474d-0432-08df2d7fd584';

beforeEach(() => ebaFetchMock.mockReset());

describe('entrar', () => {
  it('POST /login na raiz com e-mail e senha; devolve só o token e a validade', async () => {
    ebaFetchMock.mockResolvedValue(login);
    expect(await entrar('ana@adai.com.br', 'Senha@123')).toEqual({ accessToken: 'token-de-teste-da-equipe', expiresIn: 3600 });
    expect(ebaFetchMock).toHaveBeenCalledWith('login', { metodo: 'POST', raiz: true, corpo: { email: 'ana@adai.com.br', password: 'Senha@123' }, timeoutMs: 45_000 });
  });

  it('401 (e qualquer 4xx) → CredenciaisInvalidas, sem a senha na mensagem', async () => {
    for (const status of [400, 401, 403]) {
      ebaFetchMock.mockRejectedValue(new EbaApiError(status, null));
      const erro = (await entrar('ana@adai.com.br', 'Senha@123').catch((e: unknown) => e)) as Error;
      expect(erro).toBeInstanceOf(CredenciaisInvalidas);
      expect(erro.message).not.toContain('Senha@123');
    }
  });

  it('API fora (5xx, timeout) e corpo fora do formato lançam o erro original, não "credenciais inválidas"', async () => {
    ebaFetchMock.mockRejectedValue(new EbaApiError(500, null));
    await expect(entrar('a@b.com', 'x')).rejects.toBeInstanceOf(EbaApiError);
    ebaFetchMock.mockRejectedValue(new EbaApiIndisponivel('timeout'));
    await expect(entrar('a@b.com', 'x')).rejects.toBeInstanceOf(EbaApiIndisponivel);
    ebaFetchMock.mockResolvedValue({ accessToken: '' });
    await expect(entrar('a@b.com', 'x')).rejects.toThrow('resposta inválida');
  });
});

describe('listarAlunos', () => {
  it('GET Student?page=N&page-size=M com o bearer; devolve os alunos normalizados e o paginado', async () => {
    ebaFetchMock.mockResolvedValue(pagina);
    const r = await listarAlunos(TOKEN, { pagina: 2, tamanho: 20 });
    expect(ebaFetchMock).toHaveBeenCalledWith('Student?page=2&page-size=20', expect.objectContaining({ bearer: TOKEN }));
    expect(r).toEqual({
      alunos: [
        { id: ID, nome: 'Ana Exemplo', email: 'ana@exemplo.com', unidade: 'campestre', idTurma: TURMA, criadoEm: '2026-01-10T12:00:00+00:00' },
        { id: '66666666-7777-4888-9999-000000000000', nome: 'Bruno Teste', email: 'bruno@exemplo.com', unidade: 'santos', idTurma: '31c841c9-9f8b-43e9-0434-08dca8bac90d', criadoEm: '2026-02-01T12:00:00+00:00' },
      ],
      pagina: 2,
      totalPaginas: 3,
      total: 45,
    });
  });

  it.each([[0, 20], [-1, 20], [1.5, 20], [1, 0], [1, 101], [Number.NaN, 20]])('página/tamanho inválidos (%p, %p) → lança sem chamar a API', async (pagina, tamanho) => {
    await expect(listarAlunos(TOKEN, { pagina, tamanho })).rejects.toThrow();
    expect(ebaFetchMock).not.toHaveBeenCalled();
  });

  it('401 → SessaoEncerrada', async () => {
    ebaFetchMock.mockRejectedValue(new EbaApiError(401, null));
    await expect(listarAlunos(TOKEN, { pagina: 1, tamanho: 20 })).rejects.toBeInstanceOf(SessaoEncerrada);
  });

  it('corpo fora do formato → lança resposta inválida', async () => {
    ebaFetchMock.mockResolvedValue({ data: 'x' });
    await expect(listarAlunos(TOKEN, { pagina: 1, tamanho: 20 })).rejects.toThrow('resposta inválida');
  });
});

describe('buscarAlunos', () => {
  it('com @: Student/email/{e-mail codificado}, resultado único', async () => {
    ebaFetchMock.mockResolvedValue(pagina.data[0]);
    const r = await buscarAlunos(TOKEN, ' Ana+1@Exemplo.com ');
    expect(ebaFetchMock).toHaveBeenCalledWith('Student/email/ana%2B1%40exemplo.com', expect.objectContaining({ bearer: TOKEN }));
    expect(r).toHaveLength(1);
    expect(r[0].nome).toBe('Ana Exemplo');
  });

  it('sem @: Student/name/{nome codificado}, lista', async () => {
    ebaFetchMock.mockResolvedValue(pagina.data);
    const r = await buscarAlunos(TOKEN, 'ana / maria');
    expect(ebaFetchMock).toHaveBeenCalledWith('Student/name/ana%20%2F%20maria', expect.objectContaining({ bearer: TOKEN }));
    expect(r).toHaveLength(2);
  });

  it('404 → lista vazia (não encontrado não é erro)', async () => {
    ebaFetchMock.mockRejectedValue(new EbaApiError(404, 'StudentNotFound'));
    expect(await buscarAlunos(TOKEN, 'ninguem')).toEqual([]);
  });

  it.each(['', '   ', 'x'.repeat(101)])('consulta vazia ou longa demais (%p) → lança sem chamar a API', async (q) => {
    await expect(buscarAlunos(TOKEN, q)).rejects.toThrow();
    expect(ebaFetchMock).not.toHaveBeenCalled();
  });

  it('401 → SessaoEncerrada; 5xx → erro original', async () => {
    ebaFetchMock.mockRejectedValue(new EbaApiError(401, null));
    await expect(buscarAlunos(TOKEN, 'ana')).rejects.toBeInstanceOf(SessaoEncerrada);
    ebaFetchMock.mockRejectedValue(new EbaApiError(500, null));
    await expect(buscarAlunos(TOKEN, 'ana')).rejects.toBeInstanceOf(EbaApiError);
  });
});

describe('alunoDaEquipe', () => {
  it('GET Student/{id} com o bearer; 404 → null; id que não é UUID → lança sem chamar a API', async () => {
    ebaFetchMock.mockResolvedValue(pagina.data[0]);
    expect((await alunoDaEquipe(TOKEN, ID))?.email).toBe('ana@exemplo.com');
    expect(ebaFetchMock).toHaveBeenCalledWith(`Student/${ID}`, expect.objectContaining({ bearer: TOKEN }));
    ebaFetchMock.mockRejectedValue(new EbaApiError(404, null));
    expect(await alunoDaEquipe(TOKEN, ID)).toBeNull();
    ebaFetchMock.mockClear();
    await expect(alunoDaEquipe(TOKEN, '../Student')).rejects.toThrow();
    expect(ebaFetchMock).not.toHaveBeenCalled();
  });
});

describe('turmas', () => {
  it('listarTurmas percorre todas as páginas (page-size=100) e normaliza', async () => {
    ebaFetchMock
      .mockResolvedValueOnce({ ...classes, pages: { totalPages: 2, totalRecords: 5, requestDate: null } })
      .mockResolvedValueOnce({ ...classes, data: [{ ...classes.data[0], id: '99999999-9999-4999-8999-999999999999', name: 'Outra' }], pages: { totalPages: 2, totalRecords: 5, requestDate: null } });
    const turmas = await listarTurmas(TOKEN);
    expect(ebaFetchMock.mock.calls.map(([c]) => c)).toEqual(['ClassEBA?page=1&page-size=100', 'ClassEBA?page=2&page-size=100']);
    expect(turmas).toHaveLength(classes.data.length + 1);
    expect(turmas[0]).toEqual({ id: classes.data[0].id, nome: classes.data[0].name, status: 3, inicio: '2024-01-01T00:00:00', fim: '2025-01-01T00:00:00' });
  });

  it('filtro de status: ClassEBA?Status=N na consulta', async () => {
    ebaFetchMock.mockResolvedValue({ ...classes, pages: { totalPages: 1, totalRecords: 4, requestDate: null } });
    await listarTurmas(TOKEN, { status: 2 });
    expect(ebaFetchMock.mock.calls[0][0]).toBe('ClassEBA?page=1&page-size=100&Status=2');
  });

  it('criarTurma: POST ClassEBA com nome, status e datas; valida antes de chamar a API', async () => {
    ebaFetchMock.mockResolvedValue({ id: TURMA });
    await criarTurma(TOKEN, { nome: 'Turma Nova', status: 1, inicio: '2026-11-01', fim: '2027-03-01' });
    expect(ebaFetchMock).toHaveBeenCalledWith('ClassEBA', expect.objectContaining({ metodo: 'POST', bearer: TOKEN, corpo: { name: 'Turma Nova', status: 1, initialDate: '2026-11-01', endDate: '2027-03-01' } }));
    ebaFetchMock.mockClear();
    for (const ruim of [
      { nome: 'ab', status: 1, inicio: '2026-11-01', fim: '2027-03-01' },
      { nome: 'x'.repeat(201), status: 1, inicio: '2026-11-01', fim: '2027-03-01' },
      { nome: 'Turma', status: 4, inicio: '2026-11-01', fim: '2027-03-01' },
      { nome: 'Turma', status: 1, inicio: '2027-03-01', fim: '2026-11-01' },
      { nome: 'Turma', status: 1, inicio: 'amanhã', fim: '2027-03-01' },
      { nome: 'Tur\nma', status: 1, inicio: '2026-11-01', fim: '2027-03-01' },
    ]) {
      await expect(criarTurma(TOKEN, ruim)).rejects.toThrow();
    }
    expect(ebaFetchMock).not.toHaveBeenCalled();
  });

  it('editarTurma: PUT com o id; apagarTurma: DELETE ClassEBA/{id}; id inválido lança', async () => {
    ebaFetchMock.mockResolvedValue({});
    await editarTurma(TOKEN, { id: TURMA, nome: 'Turma Editada', status: 2, inicio: '2026-11-01', fim: '2027-03-01' });
    expect(ebaFetchMock).toHaveBeenCalledWith('ClassEBA', expect.objectContaining({ metodo: 'PUT', corpo: { id: TURMA, name: 'Turma Editada', status: 2, initialDate: '2026-11-01', endDate: '2027-03-01' } }));
    await apagarTurma(TOKEN, TURMA);
    expect(ebaFetchMock).toHaveBeenLastCalledWith(`ClassEBA/${TURMA}`, expect.objectContaining({ metodo: 'DELETE', bearer: TOKEN }));
    ebaFetchMock.mockClear();
    await expect(apagarTurma(TOKEN, 'x/../y')).rejects.toThrow();
    expect(ebaFetchMock).not.toHaveBeenCalled();
  });

  it('401 em qualquer ação de turma → SessaoEncerrada', async () => {
    ebaFetchMock.mockRejectedValue(new EbaApiError(401, null));
    await expect(listarTurmas(TOKEN)).rejects.toBeInstanceOf(SessaoEncerrada);
    await expect(apagarTurma(TOKEN, TURMA)).rejects.toBeInstanceOf(SessaoEncerrada);
  });
});
