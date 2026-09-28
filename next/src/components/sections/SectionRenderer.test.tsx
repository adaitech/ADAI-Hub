import { render, screen } from '@testing-library/react';
import mocks from './HeroSection/HeroSection.mock.json';
import { SectionRenderer } from './SectionRenderer';

describe('SectionRenderer', () => {
  it('renderiza as seções registradas na ordem do Strapi e ignora chaves desconhecidas', () => {
    render(
      <SectionRenderer
        sections={[mocks.completo, { __component: 'sections.nao-existe', id: 99 }, mocks.texto_longo]}
      />,
    );
    const titulos = screen.getAllByRole('heading');
    expect(titulos[0].tagName).toBe('H1');
    expect(titulos[1].tagName).toBe('H2');
    expect(screen.getAllByRole('region')).toHaveLength(2);
  });

  it('não renderiza nada sem seções', () => {
    const { container } = render(<SectionRenderer sections={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
