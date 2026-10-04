import { readFileSync } from 'fs';
import { join } from 'path';
import { render, screen, within } from '@testing-library/react';
import { Footer } from './Footer';
import mocks from './Footer.mock.json';
import { normalizeFooter } from './normalize';

describe('Footer', () => {
  it('renderiza frase da marca, colunas com títulos e links, e linha final', () => {
    render(<Footer data={mocks.completo} />);
    const footer = screen.getByRole('contentinfo');
    expect(within(footer).getByText(/Somos uma igreja/)).toBeInTheDocument();

    const nav = screen.getByRole('navigation', { name: 'Rodapé' });
    expect(within(nav).getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Igreja',
      'Participe',
      'Contato',
    ]);
    expect(within(nav).getAllByRole('link')).toHaveLength(12);
    expect(screen.getByText('© 2026 ADAI. Todos os direitos reservados.')).toBeInTheDocument();
  });

  it('abre links externos em nova aba com aviso para leitor de tela', () => {
    render(<Footer data={mocks.completo} />);
    const instagram = screen.getByRole('link', { name: /Instagram/ });
    expect(instagram).toHaveAttribute('target', '_blank');
    expect(instagram).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('mantém logo e esconde o "ADAI" decorativo de leitores de tela', () => {
    render(<Footer data={mocks.minimo} />);
    expect(screen.getByRole('link', { name: 'ADAI, página inicial' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.getByText('ADAI', { selector: 'p' })).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('normalizeFooter', () => {
  it('descarta colunas sem título ou sem links válidos e limita a 3', () => {
    const view = normalizeFooter({
      id: 1,
      colunas: [
        { id: 1, titulo: '', links: [{ id: 1, texto: 'A', url: '/a' }] },
        { id: 2, titulo: 'Sem links', links: [] },
        { id: 3, titulo: 'Um', links: [{ id: 2, texto: 'B', url: '/b' }] },
        { id: 4, titulo: 'Dois', links: [{ id: 3, texto: 'C', url: '/c' }] },
        { id: 5, titulo: 'Três', links: [{ id: 4, texto: 'D', url: '/d' }] },
        { id: 6, titulo: 'Quatro', links: [{ id: 5, texto: 'E', url: '/e' }] },
      ],
    });
    expect(view.colunas.map((c) => c.titulo)).toEqual(['Um', 'Dois', 'Três']);
  });

  it('funciona sem dados do Strapi', () => {
    expect(normalizeFooter(null)).toEqual({ colunas: [], textoMarca: undefined, copyright: undefined, assinatura: undefined });
  });

  it('sem "Preferências de cookies" (fica na Política) e o "ADAI" gigante não bloqueia cliques', () => {
    render(<Footer data={mocks.completo} />);
    expect(screen.queryByRole('button', { name: /Preferências de cookies/ })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Política de Privacidade e Cookies' })).toHaveAttribute('href', '/politica-de-privacidade');
    const css = readFileSync(join(__dirname, 'Footer.module.css'), 'utf8');
    expect(css).toMatch(/\.mega\s*\{[^}]*pointer-events:\s*none/);
  });
});
