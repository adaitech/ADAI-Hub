import { act, fireEvent, render, screen } from '@testing-library/react';
import { auditarAcessibilidade } from '@/test-utils/auditoria';
import { MenuEquipe, type MenuEquipeProps } from './MenuEquipe';

const replace = jest.fn();
let caminho = '/eba/equipe/consultas';
jest.mock('next/navigation', () => ({ useRouter: () => ({ replace }), usePathname: () => caminho }));

const sair = jest.fn().mockResolvedValue(undefined);
const montar = () => render(<MenuEquipe email="ana@adai.com.br" acoes={{ sair } as unknown as MenuEquipeProps['acoes']} />);

beforeEach(() => {
  jest.clearAllMocks();
  caminho = '/eba/equipe/consultas';
});

describe('MenuEquipe', () => {
  it('navegação rotulada com Consultas e Turmas, o e-mail de quem entrou e sem erro de acessibilidade', () => {
    const { container } = montar();
    const nav = screen.getByRole('navigation', { name: 'Área da equipe' });
    expect(nav).toContainElement(screen.getByRole('link', { name: 'Consultas' }));
    expect(screen.getByRole('link', { name: 'Turmas' })).toHaveAttribute('href', '/eba/equipe/turmas');
    expect(screen.getByText('ana@adai.com.br')).toBeInTheDocument();
    expect(auditarAcessibilidade(container)).toEqual([]);
  });

  it('marca a seção atual com aria-current (inclusive em subpáginas)', () => {
    caminho = '/eba/equipe/consultas/11111111-2222-4333-8444-555555555555';
    montar();
    expect(screen.getByRole('link', { name: 'Consultas' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Turmas' })).not.toHaveAttribute('aria-current');
  });

  it('Sair: encerra a sessão e volta ao login', async () => {
    montar();
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Sair' })));
    expect(sair).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith('/eba/equipe/login');
  });
});
