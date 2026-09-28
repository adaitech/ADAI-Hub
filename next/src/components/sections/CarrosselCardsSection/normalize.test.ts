import mocks from './CarrosselCardsSection.mock.json';
import { normalizeCarrosselCards } from './normalize';
import type { CarrosselCardsData } from './types';

const completo = mocks.completo as CarrosselCardsData;

describe('normalizeCarrosselCards', () => {
  it('normaliza as unidades da Home', () => {
    const view = normalizeCarrosselCards(completo);
    expect(view?.cards).toHaveLength(5);
    expect(view?.cards[0].destaques).toEqual(['9h', '11h', '18h']);
    expect(view?.cards[1].destaques).toEqual(['9h', '11h']);
    expect(view?.cards[0].texto).toEqual(['Av. Dom Pedro II, 3405', 'Santo André']);
    expect(view?.cards[0].link).toMatchObject({ label: 'Como chegar', novaAba: true });
    expect(view?.temImagem).toBe(false);
  });

  it('cor padrão é cinza; cor inválida vira cinza; cores escuras usam superfície escura', () => {
    const view = normalizeCarrosselCards({
      ...completo,
      cards: [
        { id: 1, titulo: 'A' },
        { id: 2, titulo: 'B', cor: 'rosa' as never },
        { id: 3, titulo: 'C', cor: 'branco' },
        { id: 4, titulo: 'D', cor: 'laranja' },
        { id: 5, titulo: 'E', cor: 'preto' },
      ],
    });
    expect(view?.cards.map((c) => [c.cor, c.superficie])).toEqual([
      ['cinza', 'clara'],
      ['cinza', 'clara'],
      ['branco', 'clara'],
      ['laranja', 'escura'],
      ['preto', 'escura'],
    ]);
  });

  it('marca temImagem quando algum card tem foto', () => {
    expect(normalizeCarrosselCards(mocks.com_imagem as CarrosselCardsData)?.temImagem).toBe(true);
  });

  it('posição da foto: acima por padrão, abaixo quando pedido', () => {
    expect(normalizeCarrosselCards({ ...completo, posicao_imagem: null })?.posicaoImagem).toBe('acima');
    expect(normalizeCarrosselCards(mocks.foto_abaixo as CarrosselCardsData)?.posicaoImagem).toBe('abaixo');
  });

  it('descarta cards sem título e não exibe a seção sem cards ou sem título', () => {
    const view = normalizeCarrosselCards({ ...completo, cards: [{ id: 1, titulo: ' ' }, { id: 2, titulo: 'Ok' }] });
    expect(view?.cards.map((c) => c.titulo)).toEqual(['Ok']);
    expect(normalizeCarrosselCards({ ...completo, cards: [] })).toBeNull();
    expect(normalizeCarrosselCards({ ...completo, titulo: '' })).toBeNull();
  });

  it('limita destaques a 4 e cards a 12, e ignora botão/link inválidos', () => {
    const view = normalizeCarrosselCards({
      ...completo,
      cards: Array.from({ length: 14 }, (_, i) => ({
        id: i,
        titulo: `Card ${i}`,
        destaques: 'a\nb\nc\nd\ne',
        botao: { id: 1, texto: 'X', url: 'javascript:alert(1)' },
        link: { id: 2, texto: '', url: '/x' },
      })),
    });
    expect(view?.cards).toHaveLength(12);
    expect(view?.cards[0].destaques).toHaveLength(4);
    expect(view?.cards[0].botao).toBeNull();
    expect(view?.cards[0].link).toBeNull();
  });
});
