import {
  descricaoDoEstilo,
  descricaoDoTemperamento,
  GRUPOS_TEMPERAMENTO,
  PARES_ESTILO,
} from './conteudo-local';

describe('conteúdo local', () => {
  it('Estilo Pessoal tem 7 pares de motivação e 7 de organização, todos preenchidos', () => {
    expect(PARES_ESTILO.motivacao).toHaveLength(7);
    expect(PARES_ESTILO.organizacao).toHaveLength(7);
    for (const p of [...PARES_ESTILO.motivacao, ...PARES_ESTILO.organizacao]) {
      expect(p.titulo && p.esquerda && p.direita).toBeTruthy();
    }
  });

  it('Temperamento tem 4 grupos numerados com 50 opções cada', () => {
    expect(GRUPOS_TEMPERAMENTO.map((g) => [g.numero, g.nome])).toEqual([
      [1, 'Sanguíneo'],
      [2, 'Colérico'],
      [3, 'Melancólico'],
      [4, 'Fleumático'],
    ]);
    for (const g of GRUPOS_TEMPERAMENTO) expect(g.opcoes).toHaveLength(50);
  });

  it('descrições do estilo existem para as 4 combinações da API e não para outras', () => {
    for (const m of [
      'Tarefa Não Estruturado',
      'Tarefa Estruturado',
      'Pessoas Não Estruturado',
      'Pessoas Estruturado',
    ]) {
      expect(descricaoDoEstilo(m)).toEqual(expect.any(String));
    }
    expect(descricaoDoEstilo('Outra')).toBeNull();
    expect(descricaoDoEstilo('constructor')).toBeNull();
  });

  it('descrições do temperamento existem para os 4 temperamentos e não para outros', () => {
    for (const n of ['Sanguíneo', 'Colérico', 'Melancólico', 'Fleumático']) {
      expect(descricaoDoTemperamento(n)).toEqual(expect.any(String));
    }
    expect(descricaoDoTemperamento('Outro')).toBeNull();
    expect(descricaoDoTemperamento('toString')).toBeNull();
  });
});
