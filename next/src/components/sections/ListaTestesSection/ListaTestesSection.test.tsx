import { render, screen, within } from '@testing-library/react';
import fixture from '@/lib/eba/__fixtures__/testes.json';
import { normalizeTeste, ordenarTestes } from '@/lib/eba/teste';
import type { StrapiTeste, TesteView } from '@/lib/eba/types';
import { listarTestesPublicados } from '@/lib/strapi/queries/testes';
import { renderizarServidor } from '@/test-utils/servidor';
import { ListaTestes } from './ListaTestes';
import { ListaTestesSection } from './ListaTestesSection';
import mocks from './ListaTestesSection.mock.json';
import type { ListaTestesData } from './types';

jest.mock('@/lib/strapi/queries/testes', () => ({ listarTestesPublicados: jest.fn() }));
const listar = listarTestesPublicados as jest.MockedFunction<typeof listarTestesPublicados>;
const testes = ordenarTestes((fixture.data as StrapiTeste[]).map((t) => normalizeTeste(t) as TesteView));
const completo = mocks.completo as ListaTestesData;
const minimo = mocks.minimo as ListaTestesData;

beforeEach(() => {
  listar.mockReset();
  // O render de servidor escreve direto no document.body: começa cada teste limpo.
  document.body.innerHTML = '';
});

describe('ListaTestesSection', () => {
  it('um artigo por teste, em ordem, com âncora, "Teste N de T" e aula', async () => {
    listar.mockResolvedValue(testes);
    const { container } = await renderizarServidor(<ListaTestesSection data={completo} index={2} />);
    const secao = container.querySelector('[data-section="lista-testes"]') as HTMLElement;
    expect(secao).toHaveAttribute('id', 'os-testes');
    expect(within(secao).getByRole('heading', { level: 2, name: 'Os 5 testes' })).toBeInTheDocument();
    const artigos = within(secao).getAllByRole('article');
    expect(artigos.map((a) => a.id)).toEqual(['dons-servico', 'temperamento-pessoal', 'talentos-naturais']);
    expect(within(artigos[0]).getByRole('heading', { level: 3, name: 'Dons de serviço prático' })).toBeInTheDocument();
    expect(artigos[0]).toHaveTextContent('Teste 1 de 3');
    expect(artigos[0]).toHaveTextContent('Aula 5 do CDV');
  });

  it('atalhos levam à âncora de cada teste; desligados, somem', () => {
    const { rerender } = render(<ListaTestes id="1" titulo="Os testes" atalhos testes={testes} nivelTitulo={2} />);
    const atalhos = screen.getByRole('navigation', { name: 'Ir para o teste' });
    expect(within(atalhos).getAllByRole('link').map((l) => l.getAttribute('href'))).toEqual([
      '#dons-servico',
      '#temperamento-pessoal',
      '#talentos-naturais',
    ]);
    rerender(<ListaTestes id="1" titulo="Os testes" atalhos={false} testes={testes} nivelTitulo={2} />);
    expect(screen.queryByRole('navigation', { name: 'Ir para o teste' })).toBeNull();
  });

  it('partes do teste em h4, perguntas/resposta em <dl> e itens como lista', () => {
    render(<ListaTestes id="1" titulo="Os testes" atalhos={false} testes={[testes[1]]} nivelTitulo={2} />);
    const artigo = screen.getByRole('article');
    expect(within(artigo).getAllByRole('heading', { level: 4 }).map((h) => h.textContent)).toEqual([
      'O que é',
      'Os 4 temperamentos',
      'Como responder',
      'Como ler o resultado',
    ]);
    expect([...artigo.querySelectorAll('dt')].map((d) => d.textContent)).toEqual(['Perguntas', 'Resposta']);
    expect(within(artigo).getAllByRole('listitem').map((l) => l.textContent)).toEqual(['Sanguíneo', 'Colérico', 'Melancólico', 'Fleumático']);
  });

  it('"Fazer o teste" leva ao link do teste, com nome acessível completo e na mesma aba', () => {
    render(<ListaTestes id="1" titulo="Os testes" atalhos={false} testes={testes} nivelTitulo={2} />);
    const botoes = screen.getAllByRole('link', { name: /^Fazer o teste/ });
    expect(botoes).toHaveLength(2);
    expect(botoes[0]).toHaveAccessibleName('Fazer o teste de Dons de serviço prático');
    expect(botoes[0]).toHaveAttribute('href', 'https://eba.adai.com.br/teste/dons-servico');
    expect(botoes[0]).not.toHaveAttribute('target');
  });

  it('teste só com o básico: sem partes vazias, sem <dl>, sem aula e sem botão', () => {
    render(<ListaTestes id="1" titulo="Os testes" atalhos={false} testes={[testes[2]]} nivelTitulo={2} />);
    const artigo = screen.getByRole('article');
    expect(within(artigo).queryAllByRole('heading', { level: 4 })).toHaveLength(0);
    expect(artigo.querySelector('dl')).toBeNull();
    expect(within(artigo).queryByRole('link')).toBeNull();
    expect(artigo).not.toHaveTextContent('do CDV');
  });

  it('abrindo a página (index 0): h1, testes em h2 e partes em h3', async () => {
    listar.mockResolvedValue(testes);
    await renderizarServidor(<ListaTestesSection data={minimo} index={0} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Testes do CDV' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(3);
    expect(screen.getAllByRole('heading', { level: 3 }).length).toBeGreaterThan(0);
  });

  it('sem testes → a seção some', async () => {
    listar.mockResolvedValue([]);
    const { container } = await renderizarServidor(<ListaTestesSection data={completo} index={2} />);
    expect(container.querySelector('[data-section="lista-testes"]')).toBeNull();
  });

  it('sem título → nada (nem busca os testes)', async () => {
    const { container } = await renderizarServidor(<ListaTestesSection data={{ ...completo, titulo: '' }} index={2} />);
    expect(container).toBeEmptyDOMElement();
    expect(listar).not.toHaveBeenCalled();
  });

  it('Strapi falha no meio da página → a seção some sem derrubar a página', async () => {
    listar.mockRejectedValue(new Error('Strapi fora'));
    const { container } = await renderizarServidor(<ListaTestesSection data={completo} index={2} />);
    expect(container.querySelector('[data-section="lista-testes"]')).toBeNull();
  });

  it('Strapi falha e a lista abre a página (index 0) → erro para o error.tsx', async () => {
    listar.mockRejectedValue(new Error('Strapi fora'));
    await expect(ListaTestesSection({ data: minimo, index: 0 })).rejects.toThrow('Strapi fora');
  });
});
