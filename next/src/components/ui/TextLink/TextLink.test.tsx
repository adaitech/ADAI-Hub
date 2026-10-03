import { render, screen } from '@testing-library/react';
import { TextLink } from './TextLink';

describe('TextLink', () => {
  it('seta é decorativa (fora do nome acessível) e a superfície vira classe', () => {
    const { container } = render(
      <TextLink href="/unidades" superficie="escura">
        Ver unidades
      </TextLink>,
    );
    expect(screen.getByRole('link', { name: 'Ver unidades' })).toHaveClass('escura');
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('padrão: superfície clara, mesma aba', () => {
    render(<TextLink href="/unidades">Ver unidades</TextLink>);
    const link = screen.getByRole('link', { name: 'Ver unidades' });
    expect(link).toHaveClass('clara');
    expect(link).not.toHaveAttribute('target');
  });
});
