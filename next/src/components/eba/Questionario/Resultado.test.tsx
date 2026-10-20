import { fireEvent, render, screen, within } from '@testing-library/react';
import type { Resultado as ResultadoApi } from '@/lib/eba-api/respostas';
import { definicaoDoTeste, type SlugTeste } from '@/lib/eba-api/testes';
import { auditarAcessibilidade } from '@/test-utils/auditoria';
import mock from './Questionario.mock.json';
import { Resultado } from './Resultado';

const montar = (slug: SlugTeste, resultado: ResultadoApi, extra: Partial<Parameters<typeof Resultado>[0]> = {}) =>
  render(<Resultado teste={definicaoDoTeste(slug)!} resultado={resultado} emailMascarado="a***@email.com" saiu={false} onSair={jest.fn()} {...extra} />);

const itens = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ nome: `Dom ${i + 1}`, total: 25 - i * 3, mensagem: i === 0 ? 'Mensagem do primeiro dom.' : null }));

describe('Resultado', () => {
  it('pontuação: barras proporcionais ao máximo, 3 primeiros em destaque e a mensagem do primeiro', () => {
    const { container } = montar('dons-servico', { tipo: 'pontuacao', itens: itens(5), maximo: 25 });
    const linhas = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(linhas).toHaveLength(5);
    expect(linhas.filter((l) => l.getAttribute('data-destaque') === 'true')).toHaveLength(3);
    const barra = (i: number) => linhas[i].querySelector<HTMLElement>('[data-barra]')!;
    expect(barra(0).style.width).toBe('100%');
    expect(barra(1).style.width).toBe('88%');
    expect(linhas[0]).toHaveTextContent('25 de 25');
    expect(screen.getByText('Cada dom vai de 0 a 25. Os três primeiros são os seus pontos de partida para a consultoria do CDV.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Dom 1' })).toBeInTheDocument();
    expect(screen.getByText('Mensagem do primeiro dom.')).toBeInTheDocument();
    expect(auditarAcessibilidade(container)).toEqual([]);
  });

  it('"Próximo teste" na ordem da apostila e "Ver todos os testes"', () => {
    montar('dons-servico', mock.resultados.nota as ResultadoApi);
    expect(screen.getByRole('link', { name: 'Próximo teste: Dons ministeriais' })).toHaveAttribute('href', '/eba/testes/dons-ministerio');
    expect(screen.getByRole('link', { name: 'Ver todos os testes' })).toHaveAttribute('href', '/eba/testes');
  });

  it('sem resultado (respostas gravadas, formato inesperado): avisa o envio, sem lista nem "Tentar de novo"', () => {
    const { container } = montar('dons-servico', { tipo: 'sem-resultado' });
    expect(screen.getByRole('heading', { level: 2, name: 'Respostas enviadas' })).toBeInTheDocument();
    expect(screen.getByText('Suas respostas foram enviadas para a equipe da EBA. Não conseguimos mostrar o resultado agora.')).toBeInTheDocument();
    expect(screen.queryByText('Seu resultado foi enviado para a equipe da EBA.')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Tentar de novo' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Próximo teste: Dons ministeriais' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument();
    expect(auditarAcessibilidade(container)).toEqual([]);
  });

  it('no último teste não há "Próximo teste"', () => {
    montar('temperamento-pessoal', mock.resultados.temperamento as ResultadoApi);
    expect(screen.queryByRole('link', { name: /Próximo teste/ })).toBeNull();
  });

  it('temperamento: porcentagens', () => {
    montar('temperamento-pessoal', mock.resultados.temperamento as ResultadoApi);
    const linhas = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(linhas[0]).toHaveTextContent('Colérico');
    expect(linhas[0]).toHaveTextContent('50%');
    expect(linhas[3]).toHaveTextContent('7%');
  });

  it('temperamento sem nenhuma marcada (máximo 0) mostra 0%', () => {
    const zerado: ResultadoApi = { tipo: 'pontuacao', maximo: 0, itens: ['Sanguíneo', 'Colérico'].map((nome) => ({ nome, total: 0, mensagem: null })) };
    montar('temperamento-pessoal', zerado);
    const linhas = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(linhas[0]).toHaveTextContent('0%');
    expect(linhas[0].querySelector<HTMLElement>('[data-barra]')!.style.width).toBe('0%');
    expect(screen.queryByText('NaN')).toBeNull();
  });

  it('talentos: lista das habilidades escolhidas, sem barras', () => {
    const { container } = montar('talentos-naturais', mock.resultados.talentos as ResultadoApi);
    const lista = screen.getByRole('list');
    expect(within(lista).getAllByRole('listitem').map((l) => l.textContent)).toEqual(['Música']);
    expect(container.querySelector('[data-barra]')).toBeNull();
  });

  it('estilo: combinação, totais e descrição', () => {
    montar('estilo-pessoal', mock.resultados.estilo as ResultadoApi);
    expect(screen.getByRole('heading', { level: 3, name: 'Tarefa Estruturado' })).toBeInTheDocument();
    expect(screen.getByText(/Cumpre a tarefa até o fim/)).toBeInTheDocument();
    expect(screen.getByText('Motivação').nextElementSibling).toHaveTextContent('14 de 35');
    expect(screen.getByText('Organização').nextElementSibling).toHaveTextContent('30 de 35');
  });

  it('estilo sem descrição conhecida mostra só a combinação', () => {
    montar('estilo-pessoal', { tipo: 'estilo', combinacao: 'Outro', descricao: null, motivacao: 7, organizacao: 7 });
    expect(screen.getByRole('heading', { level: 3, name: 'Outro' }).nextElementSibling?.tagName).not.toBe('P');
  });

  it('"Sair" chama a ação; depois de sair, avisa e esconde o botão; sem sessão, sem botão', () => {
    const onSair = jest.fn();
    const { rerender } = montar('dons-servico', mock.resultados.nota as ResultadoApi, { onSair });
    fireEvent.click(screen.getByRole('button', { name: 'Sair' }));
    expect(onSair).toHaveBeenCalledTimes(1);
    rerender(<Resultado teste={definicaoDoTeste('dons-servico')!} resultado={mock.resultados.nota as ResultadoApi} emailMascarado={null} saiu onSair={onSair} />);
    expect(screen.getByRole('status')).toHaveTextContent('Você saiu.');
    rerender(<Resultado teste={definicaoDoTeste('dons-servico')!} resultado={mock.resultados.nota as ResultadoApi} emailMascarado={null} saiu={false} onSair={onSair} />);
    expect(screen.queryByRole('button', { name: 'Sair' })).toBeNull();
  });
});
