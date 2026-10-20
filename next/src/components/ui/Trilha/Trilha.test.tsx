import { render, screen, within } from '@testing-library/react';
import { Trilha } from './Trilha';

describe('Trilha', () => {
  const itens = [{ texto: 'ADAI', href: '/' }, { texto: 'EBA', href: '/eba' }, { texto: 'Cursos', href: '/eba/cursos' }, { texto: 'Reset' }];

  it('navegação "Trilha" com lista ordenada; o último item é a página atual, sem link', () => {
    render(<Trilha itens={itens} />);
    const nav = screen.getByRole('navigation', { name: 'Trilha' });
    expect(within(nav).getByRole('list').tagName).toBe('OL');
    expect(within(nav).getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual(['/', '/eba', '/eba/cursos']);
    expect(within(nav).getByText('Reset')).toHaveAttribute('aria-current', 'page');
  });

  it('data-section="trilha": cliques saem com origem "trilha" (não "pagina")', () => {
    render(<Trilha itens={itens} />);
    expect(screen.getByRole('navigation', { name: 'Trilha' })).toHaveAttribute('data-section', 'trilha');
  });

  it('marca o nível anterior (usado como "voltar" no celular)', () => {
    render(<Trilha itens={itens} />);
    expect(screen.getByRole('link', { name: 'Cursos' }).closest('li')).toHaveClass('anterior');
  });

  it('menos de dois itens → nada (não há trilha)', () => {
    const { container } = render(<Trilha itens={[{ texto: 'EBA' }]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('textos repetidos (curso chamado "Cursos") não geram chave duplicada no React', () => {
    const erro = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(<Trilha itens={[{ texto: 'ADAI', href: '/' }, { texto: 'Cursos', href: '/eba/cursos' }, { texto: 'Cursos' }]} />);
    expect(erro.mock.calls.flat().join(' ')).not.toMatch(/same key/);
    erro.mockRestore();
  });
});

