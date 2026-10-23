import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { auditarAcessibilidade } from '@/test-utils/auditoria';
import { GerenciarTurmas, type GerenciarTurmasProps } from './GerenciarTurmas';

const replace = jest.fn();
const refresh = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ replace, refresh }) }));

const T1 = '63904477-46a9-474d-0432-08df2d7fd584';
const TURMAS = [
  { id: T1, nome: 'Membros ADAI', status: 2 as const, inicio: '2026-01-01T00:00:00', fim: '2032-01-01T00:00:00' },
  { id: '31c841c9-9f8b-43e9-0434-08dca8bac90d', nome: 'DNA 01', status: 3 as const, inicio: '2024-01-01T00:00:00', fim: '2025-01-01T00:00:00' },
];

const montar = (turmas = TURMAS, respostas: Partial<Record<'criar' | 'editar' | 'apagar', unknown>> = {}) => {
  const acoes = {
    criar: jest.fn().mockResolvedValue(respostas.criar ?? { ok: true }),
    editar: jest.fn().mockResolvedValue(respostas.editar ?? { ok: true }),
    apagar: jest.fn().mockResolvedValue(respostas.apagar ?? { ok: true }),
  };
  const r = render(<GerenciarTurmas turmas={turmas} acoes={acoes as unknown as GerenciarTurmasProps['acoes']} />);
  return { acoes, ...r };
};
const preencher = (nome = 'Turma Nova', inicio = '2026-11-01', fim = '2027-03-01') => {
  fireEvent.change(screen.getByLabelText('Nome da turma'), { target: { value: nome } });
  fireEvent.change(screen.getByLabelText('Início'), { target: { value: inicio } });
  fireEvent.change(screen.getByLabelText('Término'), { target: { value: fim } });
};
const clicar = async (nome: string | RegExp) => act(async () => fireEvent.click(screen.getByRole('button', { name: nome })));

beforeEach(() => jest.clearAllMocks());

describe('GerenciarTurmas', () => {
  it('lista as turmas com status e datas dd/mm/aaaa, formulário "Nova turma" e sem erro de acessibilidade', () => {
    const { container } = montar();
    expect(screen.getByRole('table', { name: 'Turmas (2)' })).toBeInTheDocument();
    const linha = screen.getByRole('row', { name: /Membros ADAI/ });
    expect(within(linha).getByText('Em andamento')).toBeInTheDocument();
    expect(within(linha).getByText('01/01/2026')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Nova turma' })).toBeInTheDocument();
    expect(auditarAcessibilidade(container)).toEqual([]);
  });

  it('sem turmas → mensagem', () => {
    montar([]);
    expect(screen.getByText('Nenhuma turma cadastrada.')).toBeInTheDocument();
  });

  it('criar: envia nome, status e datas, avisa, limpa o formulário e atualiza a lista', async () => {
    const { acoes } = montar();
    preencher();
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: '1' } });
    await clicar('Criar turma');
    expect(acoes.criar).toHaveBeenCalledWith({ nome: 'Turma Nova', status: 1, inicio: '2026-11-01', fim: '2027-03-01' });
    expect(screen.getByRole('status')).toHaveTextContent('Turma criada.');
    expect(screen.getByLabelText('Nome da turma')).toHaveValue('');
    expect(refresh).toHaveBeenCalled();
  });

  it('editar: carrega a turma no formulário (datas para o campo), foca o título e salva com o id', async () => {
    const { acoes } = montar();
    await clicar('Editar Membros ADAI');
    expect(screen.getByRole('heading', { level: 2, name: 'Editar turma' })).toHaveFocus();
    expect(screen.getByLabelText('Nome da turma')).toHaveValue('Membros ADAI');
    expect(screen.getByLabelText('Início')).toHaveValue('2026-01-01');
    expect(screen.getByLabelText('Status')).toHaveValue('2');
    fireEvent.change(screen.getByLabelText('Nome da turma'), { target: { value: 'Membros ADAI 2026' } });
    await clicar('Salvar alterações');
    expect(acoes.editar).toHaveBeenCalledWith({ id: T1, nome: 'Membros ADAI 2026', status: 2, inicio: '2026-01-01', fim: '2032-01-01' });
    expect(screen.getByRole('status')).toHaveTextContent('Turma atualizada.');
    expect(screen.getByRole('heading', { level: 2, name: 'Nova turma' })).toBeInTheDocument();
  });

  it('cancelar a edição volta ao formulário de nova turma', async () => {
    montar();
    await clicar('Editar DNA 01');
    await clicar('Cancelar edição');
    expect(screen.getByRole('heading', { level: 2, name: 'Nova turma' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nome da turma')).toHaveValue('');
  });

  it('apagar pede confirmação (grupo rotulado) e só chama a API depois de "Confirmar exclusão"', async () => {
    const { acoes } = montar();
    await clicar('Apagar Membros ADAI');
    const grupo = screen.getByRole('group', { name: 'Confirmar exclusão de Membros ADAI' });
    expect(within(grupo).getByText(/Não dá para desfazer/)).toBeInTheDocument();
    expect(acoes.apagar).not.toHaveBeenCalled();
    await clicar('Confirmar exclusão');
    expect(acoes.apagar).toHaveBeenCalledWith(T1);
    expect(screen.getByRole('status')).toHaveTextContent('Turma apagada.');
    expect(refresh).toHaveBeenCalled();
  });

  it('cancelar a confirmação não apaga', async () => {
    const { acoes } = montar();
    await clicar('Apagar Membros ADAI');
    await clicar('Cancelar');
    expect(acoes.apagar).not.toHaveBeenCalled();
    expect(screen.queryByRole('group')).toBeNull();
  });

  it.each([
    ['invalido', 'Confira os campos: nome de 3 a 200 caracteres e término depois do início.'],
    ['recusado', 'A API recusou os dados. Confira os campos.'],
    ['limite', 'Muitas ações seguidas. Aguarde um minuto.'],
    ['indisponivel', 'Não conseguimos concluir agora. Tente em alguns minutos.'],
  ])('criar com erro %s → mensagem em role=alert, formulário mantido e sem atualizar a lista', async (erro, mensagem) => {
    montar(TURMAS, { criar: { ok: false, erro } });
    preencher();
    await clicar('Criar turma');
    expect(screen.getByRole('alert')).toHaveTextContent(mensagem);
    expect(screen.getByLabelText('Nome da turma')).toHaveValue('Turma Nova');
    expect(refresh).not.toHaveBeenCalled();
  });

  it('apagar turma com alunos → "Esta turma tem alunos e não pode ser apagada."', async () => {
    montar(TURMAS, { apagar: { ok: false, erro: 'turma-com-alunos' } });
    await clicar('Apagar Membros ADAI');
    await clicar('Confirmar exclusão');
    expect(screen.getByRole('alert')).toHaveTextContent('Esta turma tem alunos e não pode ser apagada.');
    expect(refresh).not.toHaveBeenCalled();
  });

  it('sessão vencida em qualquer ação → login com o aviso', async () => {
    montar(TURMAS, { criar: { ok: false, erro: 'sessao' } });
    preencher();
    await clicar('Criar turma');
    expect(replace).toHaveBeenCalledWith('/eba/equipe/login?motivo=sessao');
  });

  it('a ação lança → indisponível, sem quebrar', async () => {
    const acoes = { criar: jest.fn().mockRejectedValue(new Error('x')), editar: jest.fn(), apagar: jest.fn() };
    render(<GerenciarTurmas turmas={TURMAS} acoes={acoes as unknown as GerenciarTurmasProps['acoes']} />);
    preencher();
    await clicar('Criar turma');
    expect(screen.getByRole('alert')).toHaveTextContent('Não conseguimos concluir agora');
  });
});
