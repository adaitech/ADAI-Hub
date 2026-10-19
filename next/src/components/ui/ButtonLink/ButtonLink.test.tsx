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

  it('curso (opcional) vira data-curso no link, para a medição de inscrição', () => {
    render(<ButtonLink href="https://forms.gle/x" curso="reset">Quero me inscrever</ButtonLink>);
    expect(screen.getByRole('link', { name: 'Quero me inscrever' })).toHaveAttribute('data-curso', 'reset');
  });

  it('sem curso → sem data-curso (comportamento atual)', () => {
    render(<ButtonLink href="/agenda">Agenda</ButtonLink>);
    expect(screen.getByRole('link', { name: 'Agenda' })).not.toHaveAttribute('data-curso');
  });
});

