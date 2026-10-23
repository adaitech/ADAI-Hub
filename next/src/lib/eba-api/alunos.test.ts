/** @jest-environment node */
import aluno from './__fixtures__/student-por-email.json';
import { alunoPorEmail, cadastrarAluno, normalizarEmail } from './alunos';
import { ebaFetch, EbaApiError, EbaApiRespostaInvalida } from './client';

jest.mock('./client', () => ({ ...jest.requireActual('./client'), ebaFetch: jest.fn() }));
const ebaFetchMock = jest.mocked(ebaFetch);

describe('alunos', () => {
  beforeEach(() => ebaFetchMock.mockReset());

  it('normalizarEmail faz trim e minúsculas', () => {
    expect(normalizarEmail('  Ana@Email.com ')).toBe('ana@email.com');
  });

  it('alunoPorEmail busca com o e-mail normalizado e codificado na URL', async () => {
    ebaFetchMock.mockResolvedValue(aluno);
    const r = await alunoPorEmail('  Ana+Teste@Exemplo.com ');
    expect(ebaFetchMock).toHaveBeenCalledWith('Student/email/ana%2Bteste%40exemplo.com', {});
    expect(r).toEqual({ idStudent: aluno.id, idClass: aluno.idClass });
  });

  it('alunoPorEmail repassa timeoutMs ao ebaFetch', async () => {
    ebaFetchMock.mockResolvedValue(aluno);
    await alunoPorEmail('ana@exemplo.com', { timeoutMs: 45_000 });
    expect(ebaFetchMock).toHaveBeenCalledWith('Student/email/ana%40exemplo.com', { timeoutMs: 45_000 });
  });

  it('cadastrarAluno repassa timeoutMs ao ebaFetch', async () => {
    ebaFetchMock.mockResolvedValue(aluno);
    await cadastrarAluno({ nome: 'Ana', email: 'ana@exemplo.com', unidade: 'campestre', idTurma: aluno.idClass }, { timeoutMs: 45_000 });
    expect(ebaFetchMock).toHaveBeenCalledWith('Student', expect.objectContaining({ metodo: 'POST', timeoutMs: 45_000 }));
  });

  it('404 devolve null', async () => {
    ebaFetchMock.mockRejectedValue(new EbaApiError(404, null));
    expect(await alunoPorEmail('ana@exemplo.com')).toBeNull();
  });

  it('500 e outros erros são propagados', async () => {
    const erro = new EbaApiError(500, null);
    ebaFetchMock.mockRejectedValue(erro);
    await expect(alunoPorEmail('ana@exemplo.com')).rejects.toBe(erro);
  });

  it('cadastrarAluno faz POST Student com e-mail normalizado, room e idClass', async () => {
    ebaFetchMock.mockResolvedValue(aluno);
    const r = await cadastrarAluno({
      nome: 'Ana Exemplo',
      email: ' ANA@exemplo.com',
      unidade: 'campestre',
      idTurma: aluno.idClass,
    });
    expect(ebaFetchMock).toHaveBeenCalledWith('Student', {
      metodo: 'POST',
      corpo: { name: 'Ana Exemplo', email: 'ana@exemplo.com', room: 'campestre', idClass: aluno.idClass },
    });
    expect(r).toEqual({ idStudent: aluno.id, idClass: aluno.idClass });
  });

  describe('Student com formato inesperado → EbaApiRespostaInvalida', () => {
    const invalidos = [
      ['null', null],
      ['sem id', { ...aluno, id: undefined }],
      ['id vazio', { ...aluno, id: '' }],
      ['idClass vazio', { ...aluno, idClass: '  ' }],
      ['idClass numérico', { ...aluno, idClass: 7 }],
      ['array', [aluno]],
    ] as const;

    it.each(invalidos)('GET: %s', async (_n, retorno) => {
      ebaFetchMock.mockResolvedValue(retorno);
      const erro = await alunoPorEmail('ana@exemplo.com').catch((e: unknown) => e);
      expect(erro).toBeInstanceOf(EbaApiRespostaInvalida);
      expect((erro as Error).message).not.toContain('ana@exemplo.com');
    });

    it.each(invalidos)('POST: %s', async (_n, retorno) => {
      ebaFetchMock.mockResolvedValue(retorno);
      await expect(
        cadastrarAluno({ nome: 'Ana Exemplo', email: 'ana@exemplo.com', unidade: 'campestre', idTurma: aluno.idClass }),
      ).rejects.toBeInstanceOf(EbaApiRespostaInvalida);
    });
  });
});
