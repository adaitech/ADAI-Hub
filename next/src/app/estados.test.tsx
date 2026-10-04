import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import VitrineLayout from './componentes/(vitrine)/layout';
import ErrorPage from './error';
import RootLayout, { metadata } from './layout';
import NotFound from './not-found';
import NaoEncontradaDoSite from './(site)/not-found';

jest.mock('next/server', () => ({ connection: jest.fn() }));

describe('layout raiz', () => {
  it('renderiza a cada requisição: a CSP usa um nonce novo por requisição (proxy.ts)', async () => {
    const { connection } = jest.requireMock('next/server') as { connection: jest.Mock };
    connection.mockClear();
    await RootLayout({ children: null });
    expect(connection).toHaveBeenCalledTimes(1);
  });

  it('documento em português do Brasil, com as fontes do site', async () => {
    const html = (await RootLayout({ children: null })) as ReactElement<{ lang: string; className: string }>;
    expect(html.type).toBe('html');
    expect(html.props.lang).toBe('pt-BR');
    expect(html.props.className).toMatch(/\S+ \S+/);
  });

  it('título e descrição padrão (reserva quando a página não define SEO)', () => {
    expect(metadata).toMatchObject({ title: 'ADAI', description: 'Amar a Deus. Servir as pessoas. Influenciar o mundo.' });
  });
});

describe('página não encontrada (404)', () => {
  it('um h1 claro e caminho de volta para a Home', () => {
    render(<NotFound />);
    expect(screen.getByRole('heading', { level: 1, name: 'Página não encontrada' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar para a página inicial' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'conteudo');
  });
});

describe('página não encontrada dentro do site (cabeçalho e rodapé continuam)', () => {
  it('um h1 e volta para a Home, sem um segundo <main> (o layout do site já tem)', () => {
    render(<NaoEncontradaDoSite />);
    expect(screen.getByRole('heading', { level: 1, name: 'Página não encontrada' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar para a página inicial' })).toHaveAttribute('href', '/');
    expect(screen.queryByRole('main')).toBeNull();
  });
});

describe('página de erro', () => {
  it('avisa o problema (anunciado ao leitor de tela) e permite tentar de novo', () => {
    const reset = jest.fn();
    render(<ErrorPage error={new Error('Strapi fora do ar')} reset={reset} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Não foi possível carregar esta página');
    expect(screen.getByRole('alert')).toBeInTheDocument();
    // Nunca mostra a mensagem técnica do erro para o visitante.
    expect(screen.queryByText(/Strapi fora do ar/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(reset).toHaveBeenCalled();
  });
});

describe('layout da vitrine', () => {
  it('cabeçalho próprio com volta ao índice e ao site; conteúdo no <main>', () => {
    render(<VitrineLayout>conteúdo</VitrineLayout>);
    expect(screen.getByRole('link', { name: /Vitrine de componentes/ })).toHaveAttribute('href', '/componentes');
    expect(screen.getByRole('link', { name: 'Ver o site' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('main')).toHaveTextContent('conteúdo');
  });
});
