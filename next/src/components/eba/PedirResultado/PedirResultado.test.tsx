import { StrictMode } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { auditarAcessibilidade } from '@/test-utils/auditoria';
import { PedirResultado, type PedirResultadoProps } from './PedirResultado';

const acoes = () => ({
  pedirCodigo: jest.fn().mockResolvedValue({ ok: true, dados: { emailMascarado: 'a***@exemplo.com' } }),
  confirmar: jest.fn().mockResolvedValue({ ok: true, dados: { emailMascarado: 'a***@exemplo.com' } }),
});
const montar = (a = acoes()) => ({ a, ...render(<PedirResultado acoes={a as unknown as PedirResultadoProps['acoes']} />) });
const digitarEmail = (v = 'ana@exemplo.com') => fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: v } });
const continuar = async () => {
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Continuar' })));
};
const digitarCodigo = (v: string) => fireEvent.change(screen.getByLabelText('Código de 6 dígitos'), { target: { value: v } });
const confirmar = async () => {
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Confirmar' })));
};
async function ateOCodigo(a = acoes()) {
  const r = montar(a);
  digitarEmail();
  await continuar();
  return r;
}

describe('PedirResultado', () => {
  it('ao abrir a página o foco não é movido (nem no modo estrito do React, que roda o efeito duas vezes)', () => {
    render(
      <StrictMode>
        <PedirResultado acoes={acoes() as unknown as PedirResultadoProps['acoes']} />
      </StrictMode>,
    );
    expect(document.activeElement).toBe(document.body);
  });

  it('a cada passo novo o foco vai para o título do passo', async () => {
    await ateOCodigo();
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 2, name: 'Digite o código' }));
  });

  it('abre pedindo o e-mail, com o aviso de privacidade e sem dado pessoal', () => {
    const { container } = montar();
    expect(screen.getByRole('heading', { level: 1, name: 'Receber meu resultado' })).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('autocomplete', 'email');
    expect(screen.getByRole('link', { name: 'Política de Privacidade' })).toHaveAttribute('href', '/politica-de-privacidade');
    expect(auditarAcessibilidade(container)).toEqual([]);
  });

  it('e-mail sem @ → mensagem de erro, sem chamar o servidor', async () => {
    const { a } = montar();
    digitarEmail('sem-arroba');
    await continuar();
    expect(screen.getByRole('alert')).toHaveTextContent('Confira o e-mail digitado.');
    expect(a.pedirCodigo).not.toHaveBeenCalled();
  });

  it('e-mail válido → pede o código e abre o passo do código com o e-mail mascarado', async () => {
    const { a } = await ateOCodigo();
    expect(a.pedirCodigo).toHaveBeenCalledWith('ana@exemplo.com');
    expect(screen.getByRole('heading', { level: 2, name: 'Digite o código' })).toBeInTheDocument();
    expect(screen.getByText('Enviamos um código de 6 dígitos para a***@exemplo.com.')).toBeInTheDocument();
  });

  it('código certo (colado com espaço) → "Confira seu e-mail", sem mostrar link algum', async () => {
    const { a, container } = await ateOCodigo();
    digitarCodigo('042 137');
    await confirmar();
    expect(a.confirmar).toHaveBeenCalledWith('ana@exemplo.com', '042137');
    expect(screen.getByRole('heading', { level: 2, name: 'Confira seu e-mail' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Se existir resultado para este e-mail, enviamos o link para a***@exemplo.com. Ele vale por 7 dias.');
    expect(container.innerHTML).not.toContain('/eba/resultado/');
    expect(screen.getByRole('link', { name: 'Ver todos os testes' })).toHaveAttribute('href', '/eba/testes');
  });

  it('menos de 6 dígitos → pede os 6 dígitos, sem chamar o servidor', async () => {
    const { a } = await ateOCodigo();
    digitarCodigo('123');
    await confirmar();
    expect(screen.getByRole('alert')).toHaveTextContent('Digite os 6 dígitos do código.');
    expect(a.confirmar).not.toHaveBeenCalled();
  });

  it('código errado → tentativas restantes (singular e plural) e o campo é limpo', async () => {
    const a = acoes();
    a.confirmar.mockResolvedValueOnce({ ok: false, erro: 'codigo', resultado: 'errado', restantes: 2 }).mockResolvedValueOnce({ ok: false, erro: 'codigo', resultado: 'errado', restantes: 1 });
    await ateOCodigo(a);
    digitarCodigo('111111');
    await confirmar();
    expect(screen.getByRole('alert')).toHaveTextContent('Código incorreto. Você tem mais 2 tentativas.');
    expect(screen.getByLabelText('Código de 6 dígitos')).toHaveValue('');
    digitarCodigo('222222');
    await confirmar();
    expect(screen.getByRole('alert')).toHaveTextContent('Código incorreto. Você tem mais 1 tentativa.');
  });

  it.each([['vencido', 0], ['esgotado', 0], ['errado', 0]] as const)('código %s → "Este código não vale mais" e botão "Enviar novo código"', async (resultado, restantes) => {
    const a = acoes();
    a.confirmar.mockResolvedValueOnce({ ok: false, erro: 'codigo', resultado, restantes });
    await ateOCodigo(a);
    digitarCodigo('111111');
    await confirmar();
    expect(screen.getByRole('alert')).toHaveTextContent('Este código não vale mais. Enviamos um novo?');
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Enviar novo código' })));
    expect(a.pedirCodigo).toHaveBeenCalledTimes(2);
  });

  it.each([['limite', 'Muitas tentativas. Aguarde um minuto.'], ['emails', 'Já enviamos códigos demais para este e-mail. Aguarde 15 minutos para pedir outro.'], ['indisponivel', 'Não conseguimos enviar agora. Tente em alguns minutos.'], ['invalido', 'Confira o e-mail digitado.']] as const)(
    'erro %s ao pedir o código → mensagem em role=alert e continua no e-mail',
    async (erro, mensagem) => {
      const a = acoes();
      a.pedirCodigo.mockResolvedValueOnce({ ok: false, erro });
      montar(a);
      digitarEmail();
      await continuar();
      expect(screen.getByRole('alert')).toHaveTextContent(mensagem);
      expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
    },
  );

  it('servidor lança → "indisponível", sem quebrar a tela', async () => {
    const a = acoes();
    a.pedirCodigo.mockRejectedValueOnce(new Error('x'));
    montar(a);
    digitarEmail();
    await continuar();
    expect(screen.getByRole('alert')).toHaveTextContent('Não conseguimos enviar agora');
  });

  it('dois toques rápidos em "Confirmar" → uma conferência só', async () => {
    const a = acoes();
    let liberar: (v: unknown) => void = () => undefined;
    a.confirmar.mockReturnValue(new Promise((r) => (liberar = r)));
    await ateOCodigo(a);
    digitarCodigo('042137');
    const form = screen.getByLabelText('Código de 6 dígitos').closest('form')!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    expect(a.confirmar).toHaveBeenCalledTimes(1);
    await act(async () => liberar({ ok: true, dados: { emailMascarado: 'a***@exemplo.com' } }));
    expect(screen.getByRole('heading', { level: 2, name: 'Confira seu e-mail' })).toBeInTheDocument();
  });

  it('"Usar outro e-mail" volta ao e-mail; reenvio só depois de 60 s', async () => {
    jest.useFakeTimers();
    try {
      const { a } = await ateOCodigo();
      expect(screen.getByText(/reenvie em 60 s/)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Reenviar código' })).toBeNull();
      for (let i = 0; i < 60; i += 1) {
        await act(async () => {
          jest.advanceTimersByTime(1000);
        });
      }
      await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Reenviar código' })));
      expect(a.pedirCodigo).toHaveBeenCalledTimes(2);
      fireEvent.click(screen.getByRole('button', { name: 'Usar outro e-mail' }));
      await waitFor(() => expect(screen.getByLabelText('E-mail')).toBeInTheDocument());
    } finally {
      jest.useRealTimers();
    }
  });
});
