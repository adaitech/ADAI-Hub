import { render, screen } from '@testing-library/react';
import { Chips } from './Chips';

describe('Chips', () => {
  it('sem itens → nada na tela', () => {
    const { container } = render(<Chips itens={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('lista com rótulo visível e valor de cada informação', () => {
    render(<Chips itens={[{ rotulo: 'Para quem', valor: 'A partir de 16 anos' }, { rotulo: 'Duração', valor: '7 aulas' }]} />);
    const itens = screen.getAllByRole('listitem');
    expect(itens).toHaveLength(2);
    expect(itens[0]).toHaveTextContent('Para quem');
    expect(itens[0]).toHaveTextContent('A partir de 16 anos');
  });

  it('tom inverso vira classe (sobre fundo escuro)', () => {
    render(<Chips tom="inverso" itens={[{ rotulo: 'Formato', valor: 'On-line' }]} />);
    expect(screen.getByRole('list')).toHaveClass('inverso');
  });
});
