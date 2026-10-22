/** @jest-environment node */
import { ebaFetch, EbaApiError, EbaApiIndisponivel } from './client';
import { resultadosDoAluno } from './resultados';
import { TESTES } from './testes';
import nota from './__fixtures__/survey-result-aluno-nota.json';
import estilo from './__fixtures__/survey-response-estilo.json';
import temperamento from './__fixtures__/survey-response-temperamento.json';

jest.mock('./client', () => ({ ...jest.requireActual('./client'), ebaFetch: jest.fn() }));
const ebaFetchMock = jest.mocked(ebaFetch);

const ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
const naoFez = () => Promise.reject(new EbaApiError(404, 'SurveyResponseNotFound'));

/** Responde por teste; os que não estão no mapa dão 404 (aluno não fez). */
function simular(porIdQuestion: Record<string, unknown>) {
  ebaFetchMock.mockImplementation(async (caminho: string) => {
    const idQuestion = caminho.split('/Question/')[1];
    return idQuestion in porIdQuestion ? porIdQuestion[idQuestion] : naoFez();
  });
}

describe('resultadosDoAluno', () => {
  beforeEach(() => ebaFetchMock.mockReset());

  it('busca os 5 testes em GET SurveyResult/Student/{id}/Question/{idQuestion}, com o id codificado', async () => {
    simular({});
    await resultadosDoAluno(ID);
    const caminhos = ebaFetchMock.mock.calls.map(([c]) => c).sort();
    expect(caminhos).toEqual(TESTES.map((t) => `SurveyResult/Student/${ID}/Question/${t.idQuestion}`).sort());
  });

  it('omite o teste que a API responde 404 (não feito) e mantém a ordem da apostila', async () => {
    simular({ [TESTES[4].idQuestion]: temperamento, [TESTES[0].idQuestion]: nota });
    const r = await resultadosDoAluno(ID);
    expect(r.map((x) => x.teste.slug)).toEqual(['dons-servico', 'temperamento-pessoal']);
  });

  it('nenhum teste feito → lista vazia', async () => {
    simular({});
    expect(await resultadosDoAluno(ID)).toEqual([]);
  });

  it('com várias tentativas, fica com o resultado vigente (result: true), em ordem decrescente', async () => {
    simular({ [TESTES[0].idQuestion]: nota });
    const [{ resultado }] = await resultadosDoAluno(ID);
    expect(resultado).toEqual({
      tipo: 'pontuacao',
      maximo: 25,
      itens: [
        { nome: 'Ajuda', total: 25, mensagem: 'Descrição da ajuda' },
        { nome: 'Misericórdia', total: 22, mensagem: 'Descrição da misericórdia' },
      ],
    });
  });

  it('sem nenhuma linha vigente, usa todas', async () => {
    simular({ [TESTES[0].idQuestion]: nota.map((l) => ({ ...l, result: false })) });
    const [{ resultado }] = await resultadosDoAluno(ID);
    expect(resultado.tipo === 'pontuacao' && resultado.itens).toHaveLength(3);
  });

  it('temperamento: o nome vem de message', async () => {
    simular({ [TESTES[4].idQuestion]: temperamento });
    const [{ resultado }] = await resultadosDoAluno(ID);
    expect(resultado.tipo === 'pontuacao' && resultado.itens[0].nome).toBe('Colérico');
  });

  it('estilo: combinação sem as somas dos eixos', async () => {
    simular({ [TESTES[3].idQuestion]: estilo });
    const [{ resultado }] = await resultadosDoAluno(ID);
    expect(resultado).toMatchObject({ tipo: 'estilo', motivacao: null, organizacao: null });
    expect(resultado.tipo === 'estilo' && resultado.combinacao).toEqual(expect.any(String));
  });

  it('corpo fora do formato → o teste vira "sem-resultado", sem derrubar os outros', async () => {
    simular({ [TESTES[0].idQuestion]: [{ lixo: true }], [TESTES[4].idQuestion]: temperamento });
    const r = await resultadosDoAluno(ID);
    expect(r.map((x) => x.resultado.tipo)).toEqual(['sem-resultado', 'pontuacao']);
  });

  it.each([[new EbaApiError(401, null)], [new EbaApiError(403, null)], [new EbaApiError(500, null)], [new EbaApiIndisponivel('timeout')]])(
    'falha da API (%s) → lança (a página mostra "indisponível")',
    async (erro) => {
      ebaFetchMock.mockRejectedValue(erro);
      await expect(resultadosDoAluno(ID)).rejects.toBe(erro);
    },
  );

  it.each([['../Student'], [''], ['abc'], ['3fa85f64-5717-4562-b3fc-2c963f66afa6/x']])('id inválido (%p) → lança sem chamar a rede', async (id) => {
    await expect(resultadosDoAluno(id)).rejects.toThrow();
    expect(ebaFetchMock).not.toHaveBeenCalled();
  });
});
