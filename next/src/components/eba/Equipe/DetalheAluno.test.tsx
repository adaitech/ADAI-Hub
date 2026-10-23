import { render, screen } from '@testing-library/react';
import { auditarAcessibilidade } from '@/test-utils/auditoria';
import { TESTES } from '@/lib/eba-api/testes';
import { DetalheAluno } from './DetalheAluno';

const aluno = { nome: 'Ana Exemplo', email: 'ana@exemplo.com', unidade: 'campestre', turma: 'Membros ADAI' };
const itens = [
  { nome: 'Ajuda', total: 25, mensagem: 'Descrição da ajuda' },
  { nome: 'Misericórdia', total: 22, mensagem: null },
];

describe('DetalheAluno', () => {
  it('um h1 com o nome, dados do cadastro e um h2 por teste feito (miolo do resultado reaproveitado)', () => {
    const { container } = render(
      <DetalheAluno
        aluno={aluno}
        resultados={[
          { teste: TESTES[0], resultado: { tipo: 'pontuacao', itens, maximo: 25 } },
          { teste: TESTES[3], resultado: { tipo: 'estilo', combinacao: 'Tarefa Estruturado', descricao: null, motivacao: null, organizacao: null } },
        ]}
      />,
    );
    expect(screen.getAllByRole('heading', { level: 1 }).map((h) => h.textContent)).toEqual(['Ana Exemplo']);
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['Dons de serviço prático', 'Estilo pessoal']);
    expect(screen.getByText('ana@exemplo.com')).toBeInTheDocument();
    expect(screen.getByText('Membros ADAI')).toBeInTheDocument();
    expect(screen.getByText('Descrição da ajuda')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Tarefa Estruturado' })).toBeInTheDocument();
    expect(auditarAcessibilidade(container)).toEqual([]);
  });

  it('sem testes feitos → mensagem; sem nome → "Aluno sem nome"; campos vazios → "—"', () => {
    render(<DetalheAluno aluno={{ nome: '', email: '', unidade: '', turma: 'Desconhecida' }} resultados={[]} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Aluno sem nome' })).toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(2);
    expect(screen.getByText('Este aluno ainda não fez nenhum teste.')).toBeInTheDocument();
  });
});
