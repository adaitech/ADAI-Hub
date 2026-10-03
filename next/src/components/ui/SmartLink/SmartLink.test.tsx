import { render, screen } from '@testing-library/react';
import { SmartLink } from './SmartLink';

describe('SmartLink', () => {
  it('link interno usa o next/link (navegação sem recarregar) na mesma aba', () => {
    render(<SmartLink href="/planeje-sua-visita">Planeje sua visita</SmartLink>);
    const link = screen.getByRole('link', { name: 'Planeje sua visita' });
    expect(link).toHaveAttribute('href', '/planeje-sua-visita');
    expect(link).not.toHaveAttribute('target');
  });

  it('nova aba: target, rel de segurança e aviso para leitor de tela', () => {
    render(
      <SmartLink href="https://www.youtube.com/@adai" novaAba>
        YouTube
      </SmartLink>,
    );
    const link = screen.getByRole('link', { name: 'YouTube (abre em nova aba)' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('externo sem nova aba: <a> comum, sem target', () => {
    render(<SmartLink href="mailto:contato@adai.com.br">E-mail</SmartLink>);
    expect(screen.getByRole('link', { name: 'E-mail' })).not.toHaveAttribute('target');
  });

  it('"//dominio" é externo (não passa pelo next/link)', () => {
    render(<SmartLink href="//exemplo.com">Externo</SmartLink>);
    expect(screen.getByRole('link', { name: 'Externo' })).toHaveAttribute('href', '//exemplo.com');
  });

  it('repassa classe e atributos (ex.: data-analytics)', () => {
    render(
      <SmartLink href="/contribua" className="botao" data-analytics="manual">
        Contribua
      </SmartLink>,
    );
    const link = screen.getByRole('link', { name: 'Contribua' });
    expect(link).toHaveClass('botao');
    expect(link).toHaveAttribute('data-analytics', 'manual');
  });
});
