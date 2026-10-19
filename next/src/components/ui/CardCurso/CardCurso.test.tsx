import { render, screen } from '@testing-library/react';
import fixture from '@/lib/eba/__fixtures__/cursos.json';
import { normalizeCursoResumo } from '@/lib/eba/curso';
import type { CursoResumoView, StrapiCurso } from '@/lib/eba/types';
import { CardCurso } from './CardCurso';

const [talmidim, , start] = (fixture.data as StrapiCurso[]).map((c) => normalizeCursoResumo(c) as CursoResumoView);

describe('CardCurso', () => {
  it('um único link, com o nome do curso, para a página do curso', () => {
    render(<CardCurso curso={talmidim} />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAccessibleName('Talmidim');
    expect(links[0]).toHaveAttribute('href', '/eba/cursos/talmidim');
    expect(screen.getByRole('heading', { level: 3, name: 'Talmidim' })).toBeInTheDocument();
    expect(screen.getByText('Curso de integração')).toBeInTheDocument();
  });

  it('foto com o texto alternativo da capa', () => {
    render(<CardCurso curso={talmidim} />);
    expect(screen.getByRole('img')).toHaveAttribute('alt', 'Adolescentes sentados conversam e sorriem durante um encontro na ADAI.');
  });

  it('sem capa → bloco com o nome no lugar da foto, sem <img>', () => {
    const { container } = render(<CardCurso curso={start} />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('[aria-hidden="true"]')).toHaveTextContent('Start');
  });

  it('nivelTitulo 2 → título h2', () => {
    render(<CardCurso curso={talmidim} nivelTitulo={2} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Talmidim' })).toBeInTheDocument();
  });
});
