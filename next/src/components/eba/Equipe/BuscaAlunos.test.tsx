import { act, fireEvent, render, screen } from '@testing-library/react';
import { auditarAcessibilidade } from '@/test-utils/auditoria';
import { BuscaAlunos, type BuscaAlunosProps } from './BuscaAlunos';

const replace = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));

const ALUNOS = [{ id: '11111111-2222-4333-8444-555555555555', nome: 'Ana Exemplo', email: 'ana@exemplo.com', unidade: 'campestre', turma: 'Membros ADAI' }];
const montar = (resposta: unknown = { ok: true, dados: ALUNOS }) => {
  const buscar = jest.fn().mockResolvedValue(resposta);
  const r = render(<BuscaAlunos acoes={{ buscar } as unknown as BuscaAlunosProps['acoes']} />);
  return { buscar, ...r };
};
const buscar = async (valor = 'ana') => {
  fireEvent.change(screen.getByLabelText('E-mail ou nome'), { target: { value: valor } });
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Buscar' })));
};

beforeEach(() => replace.mockClear());

describe('BuscaAlunos', () => {
  it('formulário de busca rotulado e sem erro de acessibilidade', () => {
    const { container } = montar();
    expect(screen.getByRole('search')).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail ou nome')).toHaveAttribute('autocomplete', 'off');
    expect(auditarAcessibilidade(container)).toEqual([]);
  });

  it('busca e mostra a tabela com a contagem (singular), anunciada em role=status', async () => {
    const { buscar: acao } = montar();
    await buscar('ana@exemplo.com');
    expect(acao).toHaveBeenCalledWith('ana@exemplo.com');
    expect(screen.getByRole('table', { name: 'Resultado da busca: 1 aluno' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toContainElement(screen.getByRole('table'));
    expect(screen.getByRole('link', { name: 'Ver resultado de Ana Exemplo' })).toBeInTheDocument();
  });

  it('nenhum resultado → "Nenhum aluno encontrado."', async () => {
    montar({ ok: true, dados: [] });
    await buscar('ninguem');
    expect(screen.getByText('Nenhum aluno encontrado.')).toBeInTheDocument();
  });

  it.each([
    ['invalido', 'Digite um e-mail ou parte do nome.'],
    ['limite', 'Muitas buscas. Aguarde um minuto.'],
    ['indisponivel', 'Não conseguimos buscar agora. Tente em alguns minutos.'],
  ])('erro %s → mensagem em role=alert e some a tabela antiga', async (erro, mensagem) => {
    const buscarAcao = jest.fn().mockResolvedValueOnce({ ok: true, dados: ALUNOS }).mockResolvedValueOnce({ ok: false, erro });
    render(<BuscaAlunos acoes={{ buscar: buscarAcao } as unknown as BuscaAlunosProps['acoes']} />);
    await buscar('ana');
    expect(screen.getByRole('table')).toBeInTheDocument();
    await buscar('ana');
    expect(screen.getByRole('alert')).toHaveTextContent(mensagem);
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('sessão vencida → volta ao login com o aviso', async () => {
    montar({ ok: false, erro: 'sessao' });
    await buscar();
    expect(replace).toHaveBeenCalledWith('/eba/equipe/login?motivo=sessao');
  });

  it('a ação lança → indisponível', async () => {
    const buscarAcao = jest.fn().mockRejectedValue(new Error('x'));
    render(<BuscaAlunos acoes={{ buscar: buscarAcao } as unknown as BuscaAlunosProps['acoes']} />);
    await buscar();
    expect(screen.getByRole('alert')).toHaveTextContent('Não conseguimos buscar agora');
  });

  it('o que se digita não vai para a URL, o storage nem o histórico', async () => {
    const setItem = jest.spyOn(Storage.prototype, 'setItem');
    montar();
    await buscar('ana@exemplo.com');
    expect(window.location.href).not.toContain('ana');
    expect(setItem).not.toHaveBeenCalled();
    setItem.mockRestore();
  });
});
