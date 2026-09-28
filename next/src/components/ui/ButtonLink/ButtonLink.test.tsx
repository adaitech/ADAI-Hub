import { render, screen } from '@testing-library/react';
import { ButtonLink } from './ButtonLink';

describe('ButtonLink', () => {
  it('renderiza link interno', () => {
    render(<ButtonLink href="/unidades">Unidades</ButtonLink>);
    const link = screen.getByRole('link', { name: 'Unidades' });
    expect(link).toHaveAttribute('href', '/unidades');
    expect(link).not.toHaveAttribute('target');
  });

  it('renderiza link externo em nova aba com aviso acessível', () => {
    render(
      <ButtonLink href="https://www.youtube.com/" novaAba>
        Ao vivo
      </ButtonLink>,
    );
    const link = screen.getByRole('link', { name: 'Ao vivo (abre em nova aba)' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('aplica as classes de estilo, superfície e tamanho', () => {
    render(
      <ButtonLink href="/x" estilo="contorno" superficie="escura" tamanho="sm">
        X
      </ButtonLink>,
    );
    expect(screen.getByRole('link')).toHaveClass('botao', 'contorno', 'escura', 'sm');
  });
});
