/** @jest-environment node */
import perguntasDons from './__fixtures__/question-dons-servico.json';
import { ebaFetch } from './client';
import { perguntasDoTeste } from './perguntas';

jest.mock('./client');
const ebaFetchMock = jest.mocked(ebaFetch);

describe('perguntasDoTeste', () => {
  beforeEach(() => ebaFetchMock.mockReset());

  it('devolve as 55 perguntas de dons-servico ordenadas por numero e pede Question/{idQuestion}', async () => {
    ebaFetchMock.mockResolvedValue([...perguntasDons].reverse());
    const perguntas = await perguntasDoTeste('dons-servico');
    expect(perguntas).toHaveLength(55);
    expect(perguntas.map((p) => p.numero)).toEqual(Array.from({ length: 55 }, (_, i) => i + 1));
    const primeira = perguntasDons.find((q) => q.numberQuestion === 1);
    expect(perguntas[0]).toEqual({ numero: 1, texto: primeira?.text });
    expect(ebaFetchMock).toHaveBeenCalledWith('Question/80cd890e-e0c2-45f2-84ac-2447185e85c3', {
      cache: { revalidate: 3600, tags: ['eba-testes'] },
    });
  });

  it('estilo-pessoal não tem perguntas na API: devolve [] sem chamar a API', async () => {
    expect(await perguntasDoTeste('estilo-pessoal')).toEqual([]);
    expect(ebaFetchMock).not.toHaveBeenCalled();
  });
});
