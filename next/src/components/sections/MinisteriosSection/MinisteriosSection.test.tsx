import { render, screen, within } from '@testing-library/react';
import { MinisteriosSection } from './MinisteriosSection';
import mocks from './MinisteriosSection.mock.json';
import { normalizeMinisterios } from './normalize';
import type { MinisteriosData } from './types';

const completo = mocks.completo as MinisteriosData;

describe('MinisteriosSection', () => {
  it('renderiza a lista completa na ordem editorial, sem controles de carrossel', () => {
    render(<MinisteriosSection data={completo} index={3} />);
    const secao = screen.getByRole('region', { name: 'Encontre seu lugar' });
    const itens = within(secao).getAllByRole('listitem');
    expect(itens).toHaveLength(8);
    expect(itens[0]).toHaveTextContent('KIDS');
    expect(itens[7]).toHaveTextContent('CRTV');
    expect(screen.getByRole('link', { name: /Quero servir/ })).toHaveAttribute('href', 'https://forms.gle/4wAWu99WyUVR8BcU7');
    expect(within(secao).queryByRole('button')).not.toBeInTheDocument();
  });

  it('só cria link para ministério com URL segura', () => {
    const data: MinisteriosData = {
      ...completo,
      ministerios: [
        { id: 1, nome: 'KIDS', publico: 'Crianças', url: '/ministerios/kids' },
        { id: 2, nome: 'CRTV', publico: 'Criativo', url: 'javascript:alert(1)' },
      ],
    };
    render(<MinisteriosSection data={data} index={1} />);
    expect(screen.getByRole('link', { name: /KIDS/ })).toHaveAttribute('href', '/ministerios/kids');
    expect(screen.queryByRole('link', { name: /CRTV/ })).not.toBeInTheDocument();
  });

  it('descarta itens vazios e seções sem título ou itens', () => {
    expect(normalizeMinisterios({ ...completo, ministerios: [{ id: 1, nome: ' ' }] })).toBeNull();
    expect(normalizeMinisterios({ ...completo, titulo: '' })).toBeNull();
    expect(normalizeMinisterios({ ...completo, ministerios: [{ id: 1, nome: ' ' }, ...completo.ministerios!] })?.ministerios).toHaveLength(8);
  });

  it('cards (páginas das unidades): mesma lista semântica, título e apoio acima da grade', () => {
    const data: MinisteriosData = {
      ...completo,
      titulo: 'Pra todas as idades',
      texto_apoio: 'No Campestre, tem espaço pra família inteira.',
      botao: null,
      exibicao: 'cards',
      ministerios: [
        { id: 1, nome: 'ADAI KIDS', publico: 'Crianças' },
        { id: 2, nome: 'INPULSE', publico: 'Adolescentes' },
        { id: 3, nome: 'PULSE', publico: 'Jovens' },
        { id: 4, nome: '50+', publico: '50 anos ou mais' },
      ],
    };
    render(<MinisteriosSection data={data} index={2} />);
    const secao = screen.getByRole('region', { name: 'Pra todas as idades' });
    expect(secao).toHaveAttribute('data-exibicao', 'cards');
    expect(within(secao).getByRole('heading', { level: 2 })).toBeInTheDocument();
    expect(within(within(secao).getByRole('list')).getAllByRole('listitem')).toHaveLength(4);
  });

  it('lista (Home) marca a exibição padrão', () => {
    render(<MinisteriosSection data={completo} index={3} />);
    expect(screen.getByRole('region', { name: 'Encontre seu lugar' })).toHaveAttribute('data-exibicao', 'lista');
  });
});
