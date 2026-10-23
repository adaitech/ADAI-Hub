import { render, screen, within } from '@testing-library/react';
import { auditarAcessibilidade } from '@/test-utils/auditoria';
import aulas from '@/lib/eba/__fixtures__/aulas.json';
import { normalizeAula, ordenarAulas, type AulaView } from '@/lib/eba/aula';
import type { StrapiAula } from '@/lib/eba/types';
import { AulasDoCurso } from './AulasDoCurso';

const lista = ordenarAulas(aulas.data.map((a) => normalizeAula(a as unknown as StrapiAula)!));
const atual = lista[1];

describe('AulasDoCurso', () => {
  it('player do Vimeo com título acessível, autor com foto, descrição e sem erro de acessibilidade', () => {
    const { container } = render(<AulasDoCurso nomeDoCurso="DNA" aulas={lista} atual={atual} />);
    const quadro = screen.getByTitle('Vídeo da aula: 01 - Fundamentos, Visão e Pilares');
    expect(quadro.tagName).toBe('IFRAME');
    expect(quadro.getAttribute('src')).toMatch(/^https:\/\/player\.vimeo\.com\/video\/1047669729\?h=5de9c9b90c/);
    expect(quadro).toHaveAttribute('allowfullscreen');
    expect(screen.getByRole('heading', { level: 2, name: '01 - Fundamentos, Visão e Pilares' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Foto do Pr. Rodrigo Soeiro.' })).toBeInTheDocument();
    expect(screen.getByText('Pastor Líder')).toBeInTheDocument();
    expect(screen.getByText('Aula 01 - Fundamentos, Visão e Pilares')).toBeInTheDocument();
    expect(auditarAcessibilidade(container)).toEqual([]);
  });

  it('lista de aulas do curso, na ordem, com a atual marcada por aria-current e links para as outras', () => {
    render(<AulasDoCurso nomeDoCurso="DNA" aulas={lista} atual={atual} />);
    const nav = screen.getByRole('navigation', { name: 'Aulas do DNA' });
    const links = within(nav).getAllByRole('link');
    expect(links.map((l) => l.textContent)).toEqual(['Boas Vindas', '01 - Fundamentos, Visão e Pilares', '02 - Job']);
    expect(links.map((l) => l.getAttribute('href'))).toEqual(['/eba/equipe/aulas/dna/boas-vindas', '/eba/equipe/aulas/dna/aula-01', '/eba/equipe/aulas/dna/aula-02']);
    expect(links[1]).toHaveAttribute('aria-current', 'page');
    expect(links[0]).not.toHaveAttribute('aria-current');
  });

  it('aula sem autor, foto e descrição: só o vídeo e o título', () => {
    const sem: AulaView = { ...atual, autor: null, cargoAutor: null, descricao: null, fotoAutor: null };
    render(<AulasDoCurso nomeDoCurso="DNA" aulas={[sem]} atual={sem} />);
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByTitle(/Vídeo da aula/)).toBeInTheDocument();
  });
});
