import { BOTAO_EXEMPLO, LINK_EXEMPLO, acaoDe, alternarCampo, comAcao, comEstiloBotao } from './acoes';

const botao = { id: 1, texto: 'Participar', url: '/gc', estilo: 'contorno' as const };
const link = { id: 2, texto: 'Saiba mais', url: '/gc' };

describe('controles de ação (botão / link) da vitrine', () => {
  it('acaoDe lê o que o item já tem', () => {
    expect(acaoDe({ botao, link })).toBe('botao_link');
    expect(acaoDe({ botao })).toBe('botao');
    expect(acaoDe({ link })).toBe('link');
    expect(acaoDe({})).toBe('nenhuma');
    expect(acaoDe(undefined)).toBe('nenhuma');
  });

  it('comAcao mantém o que existe e cria o exemplo só quando falta', () => {
    expect(comAcao({ botao, link: null }, 'botao_link')).toEqual({ botao, link: LINK_EXEMPLO });
    expect(comAcao({ botao: null, link }, 'botao')).toEqual({ botao: BOTAO_EXEMPLO, link: null });
    expect(comAcao({ botao, link }, 'nenhuma')).toEqual({ botao: null, link: null });
  });

  it('comEstiloBotao troca o estilo; sem botão não cria um', () => {
    expect(comEstiloBotao({ botao }, 'solido').botao?.estilo).toBe('solido');
    expect(comEstiloBotao({ botao }, 'qualquer').botao?.estilo).toBe('solido');
    expect(comEstiloBotao({ botao: { ...botao, estilo: 'solido' as const } }, 'contorno').botao?.estilo).toBe('contorno');
    expect(comEstiloBotao({ link }, 'contorno')).toEqual({ link });
  });
});

describe('alternarCampo', () => {
  type Dados = { rotulo: string | null; itens: string[] | null };
  const controle = alternarCampo<Dados, 'rotulo'>('rotulo', 'Rótulo', 'Exemplo');
  const lista = alternarCampo<Dados, 'itens'>('itens', 'Itens', ['a']);

  it('valor: ligado quando o campo tem conteúdo (string vazia e lista vazia contam como vazio)', () => {
    expect(controle.valor({ rotulo: 'X', itens: null })).toBe(true);
    expect(controle.valor({ rotulo: '', itens: null })).toBe(false);
    expect(lista.valor({ rotulo: null, itens: [] })).toBe(false);
  });

  it('aplicar: desligar → null; ligar mantém o original ou usa o exemplo', () => {
    expect(controle.aplicar({ rotulo: 'X', itens: null }, false)).toEqual({ rotulo: null, itens: null });
    expect(controle.aplicar({ rotulo: 'X', itens: null }, true).rotulo).toBe('X');
    expect(controle.aplicar({ rotulo: null, itens: null }, true).rotulo).toBe('Exemplo');
    expect(lista.aplicar({ rotulo: null, itens: [] }, true).itens).toEqual(['a']);
  });
});
