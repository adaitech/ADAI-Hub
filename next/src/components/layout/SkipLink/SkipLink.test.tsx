import { render, screen } from '@testing-library/react';
import { SkipLink } from './SkipLink';

describe('SkipLink', () => {
  it('leva ao <main id="conteudo"> (pular o menu com o teclado)', () => {
    render(<SkipLink />);
    expect(screen.getByRole('link', { name: 'Pular para o conteúdo principal' })).toHaveAttribute('href', '#conteudo');
  });
});
