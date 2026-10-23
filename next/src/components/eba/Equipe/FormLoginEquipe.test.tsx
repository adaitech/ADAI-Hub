import { act, fireEvent, render, screen } from '@testing-library/react';
import { auditarAcessibilidade } from '@/test-utils/auditoria';
import { FormLoginEquipe, type FormLoginEquipeProps } from './FormLoginEquipe';

const replace = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ replace, refresh: jest.fn() }) }));

const montar = (resposta: unknown = { ok: true }, props: Partial<FormLoginEquipeProps> = {}) => {
  const entrar = jest.fn().mockResolvedValue(resposta);
  const r = render(<FormLoginEquipe acoes={{ entrar } as unknown as FormLoginEquipeProps['acoes']} {...props} />);
  return { entrar, ...r };
};
const preencher = (email = 'ana@adai.com.br', senha = 'Senha@123') => {
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: email } });
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: senha } });
};
const enviar = async () => act(async () => fireEvent.click(screen.getByRole('button', { name: 'Entrar' })));

beforeEach(() => replace.mockClear());

describe('FormLoginEquipe', () => {
  it('campos rotulados, senha mascarada, autocomplete certo e sem erro de acessibilidade', () => {
    const { container } = montar();
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('autocomplete', 'username');
    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText('Senha')).toHaveAttribute('autocomplete', 'current-password');
    expect(auditarAcessibilidade(container)).toEqual([]);
  });

  it('credenciais certas: chama a ação com e-mail e senha e vai para as consultas', async () => {
    const { entrar } = montar();
    preencher();
    await enviar();
    expect(entrar).toHaveBeenCalledWith('ana@adai.com.br', 'Senha@123');
    expect(replace).toHaveBeenCalledWith('/eba/equipe/consultas');
  });

  it('destino personalizado', async () => {
    montar({ ok: true }, { destino: '/eba/equipe/turmas' });
    preencher();
    await enviar();
    expect(replace).toHaveBeenCalledWith('/eba/equipe/turmas');
  });

  it.each([
    ['credenciais', 'E-mail ou senha incorretos.'],
    ['invalido', 'Confira o e-mail e a senha digitados.'],
    ['limite', 'Muitas tentativas. Aguarde um minuto.'],
    ['indisponivel', 'Não conseguimos entrar agora. Tente em alguns minutos.'],
  ])('erro %s → mensagem em role=alert, senha apagada, sem navegar', async (erro, mensagem) => {
    montar({ ok: false, erro });
    preencher();
    await enviar();
    expect(screen.getByRole('alert')).toHaveTextContent(mensagem);
    expect(screen.getByLabelText('Senha')).toHaveValue('');
    expect(screen.getByLabelText('E-mail')).toHaveValue('ana@adai.com.br');
    expect(replace).not.toHaveBeenCalled();
  });

  it('a ação lança → indisponível, sem quebrar', async () => {
    const entrar = jest.fn().mockRejectedValue(new Error('x'));
    render(<FormLoginEquipe acoes={{ entrar } as unknown as FormLoginEquipeProps['acoes']} />);
    preencher();
    await enviar();
    expect(screen.getByRole('alert')).toHaveTextContent('Não conseguimos entrar agora');
  });

  it('erro novo da ação, desconhecido da tela → indisponível', async () => {
    montar({ ok: false, erro: 'sessao' });
    preencher();
    await enviar();
    expect(screen.getByRole('alert')).toHaveTextContent('Não conseguimos entrar agora');
  });

  it('dois envios seguidos: uma chamada só', async () => {
    let liberar: (v: unknown) => void = () => undefined;
    const entrar = jest.fn().mockReturnValue(new Promise((r) => (liberar = r)));
    render(<FormLoginEquipe acoes={{ entrar } as unknown as FormLoginEquipeProps['acoes']} />);
    preencher();
    const form = screen.getByLabelText('E-mail').closest('form')!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    expect(entrar).toHaveBeenCalledTimes(1);
    await act(async () => liberar({ ok: true }));
  });

  it('sessão vencida: avisa em role=status', () => {
    montar({ ok: true }, { sessaoVencida: true });
    expect(screen.getByRole('status')).toHaveTextContent('Sua sessão terminou. Entre de novo.');
  });

  it('a senha não vai para storage nem para a URL', async () => {
    const setItem = jest.spyOn(Storage.prototype, 'setItem');
    montar();
    preencher('ana@adai.com.br', 'Senha@123');
    await enviar();
    expect(setItem).not.toHaveBeenCalled();
    expect(window.location.href).not.toContain('Senha');
    setItem.mockRestore();
  });
});
