import { render, screen, within } from '@testing-library/react';
import { auditarAcessibilidade } from '@/test-utils/auditoria';
import { Paginacao } from './Paginacao';
import { TabelaAlunos } from './TabelaAlunos';

const ID = '11111111-2222-4333-8444-555555555555';
const alunos = [
  { id: ID, nome: 'Ana Exemplo', email: 'ana@exemplo.com', unidade: 'campestre', turma: 'Membros ADAI' },
  { id: '66666666-7777-4888-9999-000000000000', nome: '', email: '', unidade: '', turma: 'Desconhecida' },
];

describe('TabelaAlunos', () => {
  it('tabela com legenda, cabeçalhos de coluna e de linha, e link de detalhe por id (nunca por e-mail ou nome)', () => {
    const { container } = render(<TabelaAlunos alunos={alunos} legenda="Alunos (45)" />);
    expect(screen.getByRole('table', { name: 'Alunos (45)' })).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader').map((c) => c.textContent)).toEqual(['Nome', 'E-mail', 'Turma', 'Unidade', 'Ações']);
    const link = screen.getByRole('link', { name: 'Ver resultado de Ana Exemplo' });
    expect(link).toHaveAttribute('href', `/eba/equipe/consultas/${ID}`);
    expect(link.getAttribute('href')).not.toMatch(/@|ana/i);
    expect(auditarAcessibilidade(container)).toEqual([]);
  });

  it('campos vazios viram "—" e o link diz "aluno sem nome"', () => {
    render(<TabelaAlunos alunos={alunos} legenda="x" />);
    const linha = screen.getAllByRole('row')[2];
    expect(within(linha).getAllByText('—')).toHaveLength(3);
    expect(screen.getByRole('link', { name: 'Ver resultado de aluno sem nome' })).toBeInTheDocument();
  });

  it('lista vazia → "Nenhum aluno encontrado.", sem tabela', () => {
    render(<TabelaAlunos alunos={[]} legenda="x" />);
    expect(screen.getByText('Nenhum aluno encontrado.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).toBeNull();
  });
});

describe('Paginacao', () => {
  it('meio: anterior, "Página 2 de 3" e próxima, por link com ?pagina=N (sem dado pessoal)', () => {
    render(<Paginacao pagina={2} totalPaginas={3} base="/eba/equipe/consultas" />);
    expect(screen.getByRole('navigation', { name: 'Páginas de alunos' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Página anterior' })).toHaveAttribute('href', '/eba/equipe/consultas?pagina=1');
    expect(screen.getByRole('link', { name: 'Próxima página' })).toHaveAttribute('href', '/eba/equipe/consultas?pagina=3');
    expect(screen.getByText('Página 2 de 3')).toHaveAttribute('aria-current', 'page');
  });

  it('primeira página sem "anterior"; última sem "próxima"; página única não mostra nada', () => {
    const { rerender, container } = render(<Paginacao pagina={1} totalPaginas={3} base="/x" />);
    expect(screen.queryByRole('link', { name: 'Página anterior' })).toBeNull();
    rerender(<Paginacao pagina={3} totalPaginas={3} base="/x" />);
    expect(screen.queryByRole('link', { name: 'Próxima página' })).toBeNull();
    rerender(<Paginacao pagina={1} totalPaginas={1} base="/x" />);
    expect(container).toBeEmptyDOMElement();
  });
});
