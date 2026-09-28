import { fireEvent, render, screen, within } from '@testing-library/react';
import { CarrosselCardsSection } from './CarrosselCardsSection';
import mocks from './CarrosselCardsSection.mock.json';
import type { CarrosselCardsData } from './types';

const completo = mocks.completo as CarrosselCardsData;

/** jsdom não calcula layout: simula uma trilha com 5 cards de 273px e 600px visíveis. */
function simularLayout(trilha: HTMLElement) {
  Object.defineProperty(trilha, 'scrollWidth', { configurable: true, value: 5 * 273 });
  Object.defineProperty(trilha, 'clientWidth', { configurable: true, value: 600 });
  trilha.querySelectorAll<HTMLElement>(':scope > li').forEach((li, i) => {
    Object.defineProperty(li, 'offsetLeft', { configurable: true, value: i * 273 });
    Object.defineProperty(li, 'offsetWidth', { configurable: true, value: 261 });
  });
  const scrollTo = jest.fn((opts: ScrollToOptions) => {
    trilha.scrollLeft = opts.left ?? 0;
  });
  trilha.scrollTo = scrollTo as unknown as typeof trilha.scrollTo;
  return scrollTo;
}

describe('CarrosselCardsSection', () => {
  it('renderiza título, cards como lista e links acessíveis', () => {
    render(<CarrosselCardsSection data={completo} index={1} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Neste domingo' })).toBeInTheDocument();
    const trilha = screen.getByRole('list', { name: 'Neste domingo: 5 cards' });
    const cards = within(trilha).getAllByRole('heading', { level: 3 });
    expect(cards.map((c) => c.textContent)).toEqual(['Campestre', 'Anália Franco', 'São Bernardo', 'Santos', 'ADAI On']);
    expect(within(trilha).getAllByRole('link', { name: /Como chegar/ })[0]).toHaveAttribute('target', '_blank');
  });

  it('avança um card por clique e volta ao início depois do último', () => {
    render(<CarrosselCardsSection data={completo} index={1} />);
    const trilha = screen.getByRole('list', { name: /Neste domingo/ });
    const scrollTo = simularLayout(trilha);
    const proximo = screen.getByRole('button', { name: 'Próximo card' });

    fireEvent.click(proximo);
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 273, behavior: 'smooth' });
    expect(screen.getByText('Card 2 de 5.')).toBeInTheDocument();

    trilha.scrollLeft = 5 * 273 - 600; // fim
    fireEvent.click(proximo);
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 0, behavior: 'smooth' });
    expect(screen.getByText('Voltando ao início. Card 1 de 5.')).toBeInTheDocument();
  });

  it('a seta "anterior" no início vai para o último card', () => {
    render(<CarrosselCardsSection data={completo} index={1} />);
    const trilha = screen.getByRole('list', { name: /Neste domingo/ });
    const scrollTo = simularLayout(trilha);
    fireEvent.click(screen.getByRole('button', { name: 'Card anterior' }));
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 5 * 273 - 600, behavior: 'smooth' });
    expect(screen.getByText(/Indo para o fim/)).toBeInTheDocument();
  });

  it('renderiza cards com foto, botão e link', () => {
    render(<CarrosselCardsSection data={mocks.com_imagem as CarrosselCardsData} index={1} />);
    expect(screen.getAllByRole('img')[0]).toHaveAttribute('alt', expect.any(String));
    expect(screen.getAllByRole('link', { name: 'Quero participar' })).toHaveLength(8);
    expect(screen.getAllByRole('link', { name: /Falar com a liderança/ })).toHaveLength(8);
    expect(screen.getByRole('link', { name: /Ver todos os ministérios/ })).toHaveAttribute('href', '/ministerios');
  });

  it('mantém a hierarquia de títulos quando é a primeira seção da página', () => {
    render(<CarrosselCardsSection data={completo} index={0} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Neste domingo' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(5);
    expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
  });

  it('card colorido usa botão e link para fundo escuro', () => {
    render(
      <CarrosselCardsSection
        data={{
          ...completo,
          cards: [
            {
              id: 1,
              titulo: 'KIDS',
              cor: 'azul',
              botao: { id: 1, texto: 'Quero participar', url: '/kids', estilo: 'solido' },
              link: { id: 2, texto: 'Falar com a liderança', url: '/contato' },
            },
          ],
        }}
        index={1}
      />,
    );
    const card = screen.getByRole('heading', { name: 'KIDS' }).closest('li');
    expect(card).toHaveAttribute('data-cor', 'azul');
    expect(screen.getByRole('link', { name: 'Quero participar' })).toHaveClass('escura');
    expect(screen.getByRole('link', { name: /Falar com a liderança/ })).toHaveClass('escura');
  });

  it('foto abaixo: a trilha recebe a classe que move a foto para a última linha', () => {
    render(<CarrosselCardsSection data={mocks.foto_abaixo as CarrosselCardsData} index={1} />);
    const trilha = screen.getByRole('list', { name: /Eventos com foto abaixo/ });
    expect(trilha).toHaveClass('comImagem', 'imagemAbaixo');
    expect(screen.getAllByRole('img')).toHaveLength(3);
  });

  it('não renderiza nada sem cards válidos', () => {
    const { container } = render(<CarrosselCardsSection data={{ ...completo, cards: [] }} index={1} />);
    expect(container).toBeEmptyDOMElement();
  });
});
