/** @jest-environment node */
import { ebaFetch } from './client';
import { enviarRespostas } from './respostas';
import estilo from './__fixtures__/survey-response-estilo.json';
import nota from './__fixtures__/survey-response-nota.json';
import talentos from './__fixtures__/survey-response-talentos.json';
import temperamento from './__fixtures__/survey-response-temperamento.json';

jest.mock('./client');
const ebaFetchMock = jest.mocked(ebaFetch);

const base = { idStudent: 'aluno-1', idClass: 'turma-1' };

describe('enviarRespostas', () => {
  beforeEach(() => ebaFetchMock.mockReset());

  it('envia POST SurveyResponse com idQuestion do teste e numberQuestion/rate de cada item', async () => {
    ebaFetchMock.mockResolvedValue(nota);
    await enviarRespostas({
      ...base,
      slug: 'dons-servico',
      respostas: [
        { numero: 1, nota: 5 },
        { numero: 2, nota: 0 },
      ],
    });
    expect(ebaFetchMock).toHaveBeenCalledWith('SurveyResponse', {
      metodo: 'POST',
      corpo: {
        responseQuestionList: [
          { idStudent: 'aluno-1', idClass: 'turma-1', idQuestion: '80cd890e-e0c2-45f2-84ac-2447185e85c3', numberQuestion: 1, rate: 5 },
          { idStudent: 'aluno-1', idClass: 'turma-1', idQuestion: '80cd890e-e0c2-45f2-84ac-2447185e85c3', numberQuestion: 2, rate: 0 },
        ],
      },
    });
  });

  it('nota: itens por total decrescente, maximo 25 e mensagem vazia vira null', async () => {
    ebaFetchMock.mockResolvedValue(nota);
    const r = await enviarRespostas({ ...base, slug: 'dons-ministerio', respostas: [{ numero: 1, nota: 3 }] });
    expect(r).toEqual({
      tipo: 'pontuacao',
      maximo: 25,
      itens: [
        { nome: 'Misericórdia', total: 25, mensagem: 'Dom de misericórdia' },
        { nome: 'Ensino', total: 22, mensagem: 'Dom de ensino' },
        { nome: 'Fé', total: 18, mensagem: null },
      ],
    });
  });

  it('talentos: maximo 1 e itens ordenados por total', async () => {
    ebaFetchMock.mockResolvedValue([...talentos].reverse());
    const r = await enviarRespostas({ ...base, slug: 'talentos-naturais', respostas: [{ numero: 1, nota: 1 }] });
    expect(r.tipo).toBe('pontuacao');
    if (r.tipo !== 'pontuacao') return;
    expect(r.maximo).toBe(1);
    expect(r.itens.map((i) => i.nome)).toEqual(['Música', 'Escrita']);
    expect(r.itens[1].mensagem).toBeNull();
  });

  it('temperamento: maximo é a soma dos totais e a mensagem vem da descrição local', async () => {
    ebaFetchMock.mockResolvedValue(temperamento);
    const r = await enviarRespostas({
      ...base,
      slug: 'temperamento-pessoal',
      respostas: [1, 2, 3, 4].map((numero) => ({ numero, nota: 10 })),
    });
    expect(r.tipo).toBe('pontuacao');
    if (r.tipo !== 'pontuacao') return;
    expect(r.maximo).toBe(70);
    expect(r.itens.map((i) => i.nome)).toEqual(['Colérico', 'Sanguíneo', 'Melancólico', 'Fleumático']);
    expect(r.itens[0].mensagem).toMatch(/colérico/i);
    expect(r.itens[0].mensagem).not.toBe('x');
  });

  it('estilo: combinação da API, descrição local e motivação/organização dos itens 1 e 2', async () => {
    ebaFetchMock.mockResolvedValue(estilo);
    const r = await enviarRespostas({
      ...base,
      slug: 'estilo-pessoal',
      respostas: [
        { numero: 2, nota: 40 },
        { numero: 1, nota: 25 },
      ],
    });
    expect(r).toEqual({
      tipo: 'estilo',
      combinacao: 'Tarefa Estruturado',
      descricao: expect.any(String),
      motivacao: 25,
      organizacao: 40,
    });
  });

  it('estilo: aceita a resposta como array de um item', async () => {
    ebaFetchMock.mockResolvedValue([estilo]);
    const r = await enviarRespostas({
      ...base,
      slug: 'estilo-pessoal',
      respostas: [
        { numero: 1, nota: 10 },
        { numero: 2, nota: 11 },
      ],
    });
    expect(r).toMatchObject({ tipo: 'estilo', combinacao: 'Tarefa Estruturado', motivacao: 10, organizacao: 11 });
  });

  it('estilo: combinação desconhecida fica sem descrição', async () => {
    ebaFetchMock.mockResolvedValue({ message: 'Outra' });
    const r = await enviarRespostas({ ...base, slug: 'estilo-pessoal', respostas: [] });
    expect(r).toMatchObject({ tipo: 'estilo', combinacao: 'Outra', descricao: null, motivacao: 0, organizacao: 0 });
  });
});
