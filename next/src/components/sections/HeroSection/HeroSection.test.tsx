import { render, screen } from '@testing-library/react';
import { HeroSection } from './HeroSection';
import mocks from './HeroSection.mock.json';
import type { HeroData } from './types';

const completo = mocks.completo as HeroData;

describe('HeroSection', () => {
  it('renderiza a frase principal como h1 quando é a primeira seção', () => {
    render(<HeroSection data={completo} index={0} />);
    const titulo = screen.getByRole('heading', { level: 1 });
    expect(titulo).toHaveTextContent('Amar.Servir.Influenciar.');
    expect(screen.getByRole('region', { name: /Amar/ })).toBeInTheDocument();
  });

  it('usa h2 quando não é a primeira seção', () => {
    render(<HeroSection data={completo} index={2} />);
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  });

  it('renderiza a foto com texto alternativo e os botões como links', () => {
    render(<HeroSection data={completo} index={0} />);
    expect(screen.getByRole('img')).toHaveAttribute('alt', expect.stringContaining('Voluntária'));
    expect(screen.getByRole('link', { name: 'Planeje sua visita' })).toHaveAttribute('href', '/planeje-sua-visita');
    expect(screen.getByRole('link', { name: 'Unidades' })).toHaveAttribute('href', '/unidades');
  });

  it('avisa quando o botão abre em nova aba', () => {
    render(<HeroSection data={mocks.texto_longo as HeroData} index={0} />);
    const link = screen.getByRole('link', { name: /Assista ao vivo/ });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveTextContent('(abre em nova aba)');
  });

  it('não renderiza nada sem frase principal', () => {
    const { container } = render(<HeroSection data={{ ...completo, titulo: '' }} index={0} />);
    expect(container).toBeEmptyDOMElement();
  });
});
