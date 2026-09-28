import { fireEvent, render, screen } from '@testing-library/react';
import { Header } from './Header';
import mocks from './Header.mock.json';
import { normalizeHeader } from './normalize';
import type { HeaderData } from './types';

const completo = mocks.completo as HeaderData;

describe('Header', () => {
  it('tem logo que leva à página inicial, menu principal e botões', () => {
    render(<Header data={completo} />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'ADAI, página inicial' })).toHaveAttribute('href', '/');
    const nav = screen.getByRole('navigation', { name: 'Principal' });
    expect(nav.querySelectorAll('a')).toHaveLength(5);
    expect(screen.getByRole('link', { name: 'Planeje sua visita' })).toHaveAttribute('href', '/planeje-sua-visita');
  });

  it('abre e fecha o menu mobile, devolvendo o foco com Esc', () => {
    render(<Header data={completo} />);
    const alternar = screen.getByRole('button', { name: 'Menu' });
    expect(alternar).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(alternar);
    expect(alternar).toHaveAttribute('aria-expanded', 'true');
    expect(alternar).toHaveTextContent('Fechar');
    expect(screen.getAllByRole('navigation', { name: 'Principal' })).toHaveLength(2);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(alternar).toHaveAttribute('aria-expanded', 'false');
    expect(alternar).toHaveFocus();
  });

  it('mostra só o logo quando o Strapi não tem links nem botões', () => {
    render(<Header data={mocks.minimo} />);
    expect(screen.getByRole('link', { name: 'ADAI, página inicial' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Menu' })).not.toBeInTheDocument();
  });

  it('renderiza mesmo sem dados do Strapi', () => {
    render(<Header data={null} />);
    expect(screen.getByRole('link', { name: 'ADAI, página inicial' })).toBeInTheDocument();
  });
});

describe('normalizeHeader', () => {
  it('limita a 6 links e 2 botões e descarta itens inválidos', () => {
    const view = normalizeHeader({
      id: 1,
      links: [
        ...Array.from({ length: 7 }, (_, i) => ({ id: i, texto: `L${i}`, url: `/l${i}` })),
        { id: 99, texto: 'Ruim', url: 'javascript:void(0)' },
      ],
      botoes: [
        { id: 1, texto: 'A', url: '/a', estilo: 'contorno' },
        { id: 2, texto: '', url: '/b' },
        { id: 3, texto: 'C', url: '/c' },
        { id: 4, texto: 'D', url: '/d' },
      ],
    });
    expect(view.links).toHaveLength(6);
    expect(view.botoes.map((b) => b.label)).toEqual(['A', 'C']);
  });
});
