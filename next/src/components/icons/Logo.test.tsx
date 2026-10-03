import { render } from '@testing-library/react';
import { Logo } from './Logo';

describe('Logo', () => {
  it('é decorativo: fora da árvore de acessibilidade e sem foco (o nome fica no link)', () => {
    const { container } = render(<Logo />);
    const svg = container.querySelector('svg')!;
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
  });

  it('enquadramento "frame" (Header) e "justo" (Footer) mudam só a caixa, não o desenho', () => {
    const frame = render(<Logo />).container.querySelector('svg')!;
    const justo = render(<Logo enquadramento="justo" />).container.querySelector('svg')!;
    expect(frame).toHaveAttribute('viewBox', '0 0 99.21 32.6');
    expect(justo).toHaveAttribute('viewBox', '19.455 3.289 60.307 26.02');
    expect(justo.innerHTML).toBe(frame.innerHTML);
  });
});
