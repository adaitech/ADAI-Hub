import { definicaoDoTeste, ESCALA_NOTA, proximoTeste, TESTES, UNIDADES } from './testes';

describe('TESTES', () => {
  it('tem os 5 testes na ordem da apostila com os idQuestion da restrição global', () => {
    expect(TESTES.map((t) => [t.slug, t.idQuestion, t.tipo, t.ordem])).toEqual([
      ['dons-servico', '80cd890e-e0c2-45f2-84ac-2447185e85c3', 'nota', 1],
      ['dons-ministerio', 'f055b0b0-c5e4-46bf-a778-93ea00c02826', 'nota', 2],
      ['talentos-naturais', '49850007-06ae-49ad-ac22-6d2527404059', 'talentos', 3],
      ['estilo-pessoal', 'e6bb31ca-7151-4c1f-8815-7f794e0c5bb4', 'estilo', 4],
      ['temperamento-pessoal', '8699a220-0588-4c3f-8609-e1be453d2edd', 'temperamento', 5],
    ]);
  });

  it('nomes que o aluno vê (os mesmos da página /eba/testes)', () => {
    expect(TESTES.map((t) => t.nome)).toEqual(['Dons de serviço prático', 'Dons ministeriais', 'Talentos naturais', 'Estilo pessoal', 'Temperamento pessoal']);
  });
});

describe('definicaoDoTeste', () => {
  it('devolve o teste do slug', () => {
    expect(definicaoDoTeste('estilo-pessoal')?.tipo).toBe('estilo');
  });

  it('devolve null para slug desconhecido, inclusive nomes herdados de Object', () => {
    expect(definicaoDoTeste('x')).toBeNull();
    expect(definicaoDoTeste('constructor')).toBeNull();
  });
});

describe('proximoTeste', () => {
  it('devolve o seguinte na ordem da apostila', () => {
    expect(proximoTeste('dons-servico')?.slug).toBe('dons-ministerio');
  });

  it('devolve null no último', () => {
    expect(proximoTeste('temperamento-pessoal')).toBeNull();
  });
});

describe('ESCALA_NOTA', () => {
  it('tem os 6 rótulos exatos de 0 a 5', () => {
    expect(ESCALA_NOTA).toEqual([
      { valor: 0, rotulo: 'Nunca' },
      { valor: 1, rotulo: 'Raramente' },
      { valor: 2, rotulo: 'Às vezes' },
      { valor: 3, rotulo: 'Frequentemente' },
      { valor: 4, rotulo: 'Muito' },
      { valor: 5, rotulo: 'Eu brilho nisso!' },
    ]);
  });
});

describe('UNIDADES', () => {
  it('tem os valores e rótulos da restrição global (Anália Franco grava colorado)', () => {
    expect(UNIDADES).toEqual([
      { valor: 'campestre', rotulo: 'Campestre' },
      { valor: 'colorado', rotulo: 'Anália Franco' },
      { valor: 'sbc', rotulo: 'São Bernardo do Campo' },
      { valor: 'santos', rotulo: 'Santos' },
      { valor: 'adai-on', rotulo: 'ADAI On' },
      { valor: 'outra-igreja', rotulo: 'Outra igreja' },
      { valor: 'visitante', rotulo: 'Visitante' },
    ]);
  });
});
