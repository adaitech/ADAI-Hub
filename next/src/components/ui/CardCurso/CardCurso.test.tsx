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

  it('Para quem e Duração numa lista de definição (rótulo + valor), sem chips', () => {
    const { container } = render(<CardCurso curso={talmidim} />);
    const termos = [...container.querySelectorAll('dl dt')].map((dt) => dt.textContent);
    const valores = [...container.querySelectorAll('dl dd')].map((dd) => dd.textContent);
    expect(termos).toEqual(['Para quem', 'Duração']);
    expect(valores).toEqual(['Adolescentes de 12 a 15 anos', '13 aulas de 1 hora, semanais']);
    expect(container.querySelector('ul')).toBeNull();
  });

  it('no máximo 2 informações; sem nenhuma, não há <dl>', () => {
    const { container, rerender } = render(<CardCurso curso={{ ...talmidim, chips: [...talmidim.chips, { rotulo: 'Extra', valor: 'x' }] }} />);
    expect(container.querySelectorAll('dl dt')).toHaveLength(2);
    rerender(<CardCurso curso={{ ...talmidim, chips: [] }} />);
    expect(container.querySelector('dl')).toBeNull();
  });

  it('"Conhecer o curso" é só visual: fora da árvore de acessibilidade', () => {
    render(<CardCurso curso={talmidim} />);
    expect(screen.getByText('Conhecer o curso')).toHaveAttribute('aria-hidden', 'true');
  });

  it('nivelTitulo 2 → título h2', () => {
    render(<CardCurso curso={talmidim} nivelTitulo={2} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Talmidim' })).toBeInTheDocument();
  });
});
