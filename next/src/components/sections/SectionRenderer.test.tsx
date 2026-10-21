import { render, screen } from '@testing-library/react';
import mocks from './HeroSection/HeroSection.mock.json';
import { SectionRenderer } from './SectionRenderer';
import type { TextoRicoData } from './TextoRicoSection/types';

describe('SectionRenderer', () => {
  it('variação institucional em grade mantém o título e a seção de visão no renderer compartilhado', () => {
    const texto: TextoRicoData = { __component: 'sections.texto-rico', id: 503, titulo: 'A igreja que vemos', conteudo: 'Uma comunidade para caminhar juntos.' };
    const { container } = render(<SectionRenderer apresentacao="institucional-grade" sections={[mocks.completo, texto]} />);
    expect(container.querySelector('[data-page-layout="institucional-grade"]')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'A igreja que vemos' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });
  it('página institucional com capa mantém um único h1 no texto, sem título sobre a foto', () => {
    const texto: TextoRicoData = { __component: 'sections.texto-rico', id: 501, titulo: 'Jesus', conteudo: 'Uma pessoa para conhecer.\n\n## Quem é Jesus?\n\nJesus é o Filho de Deus.' };
    const { container } = render(<SectionRenderer apresentacao="institucional" sections={[mocks.completo, texto]} />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1, name: 'Jesus' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Quem é Jesus?' })).toBeInTheDocument();
    expect(container.querySelector('[data-page-layout="institucional"]')).toBeInTheDocument();
    expect(container.querySelector('[data-section="hero"] h1')).toBeNull();
  });
  it('página institucional sem capa começa pelo título do documento', () => {
    const texto: TextoRicoData = { __component: 'sections.texto-rico', id: 502, titulo: 'Nossa história', conteudo: 'Uma história de fé.' };
    render(<SectionRenderer apresentacao="institucional" sections={[texto]} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Nossa história' })).toBeInTheDocument();
  });
  it('apresentação editorial agrupa seções em uma largura comum sem mudar o padrão', () => {
    const { container, rerender } = render(<SectionRenderer sections={[mocks.completo]} apresentacao="editorial" />);
    expect(container.querySelector('[data-page-layout="editorial"]')).toBeInTheDocument();
    rerender(<SectionRenderer sections={[mocks.completo]} />);
    expect(container.querySelector('[data-page-layout]')).not.toBeInTheDocument();
  });
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

  it('indiceInicial: seções depois de um título próprio da página começam em h2', () => {
    render(<SectionRenderer sections={[mocks.completo]} indiceInicial={1} />);
    expect(screen.getByRole('heading').tagName).toBe('H2');
  });

  it('não renderiza nada sem seções', () => {
    const { container } = render(<SectionRenderer sections={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
