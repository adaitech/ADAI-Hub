import { screen, within } from '@testing-library/react';
import fixture from '@/lib/eba/__fixtures__/cursos.json';
import { normalizeCursoResumo } from '@/lib/eba/curso';
import type { CursoResumoView, StrapiCurso } from '@/lib/eba/types';
import { listarCursosPublicados } from '@/lib/strapi/queries/cursos';
import { renderizarServidor } from '@/test-utils/servidor';
import { CatalogoCursosSection } from './CatalogoCursosSection';
import mocks from './CatalogoCursosSection.mock.json';
import type { CatalogoCursosData } from './types';

jest.mock('@/lib/strapi/queries/cursos', () => ({ listarCursosPublicados: jest.fn() }));
const listar = listarCursosPublicados as jest.MockedFunction<typeof listarCursosPublicados>;
const cursos = (fixture.data as StrapiCurso[]).map((c) => normalizeCursoResumo(c) as CursoResumoView);
const completo = mocks.completo as CatalogoCursosData;
const minimo = mocks.minimo as CatalogoCursosData;

beforeEach(() => listar.mockReset());

describe('CatalogoCursosSection', () => {
  it('lista os cursos publicados em ordem, com "Ver todos os cursos" e data-section', async () => {
    listar.mockResolvedValue(cursos);
    const { container } = await renderizarServidor(<CatalogoCursosSection data={completo} index={2} />);
    const secao = container.querySelector('[data-section="catalogo-cursos"]') as HTMLElement;
    expect(within(secao).getByRole('heading', { level: 2, name: completo.titulo! })).toBeInTheDocument();
    expect(within(secao).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['Reset', 'Start', 'Talmidim']);
    expect(within(secao).getByRole('link', { name: 'Ver todos os cursos' })).toHaveAttribute('href', '/eba/cursos');
  });

  it('respeita a quantidade e esconde o link quando desligado', async () => {
    listar.mockResolvedValue(cursos);
    await renderizarServidor(<CatalogoCursosSection data={{ ...completo, quantidade: 2, link_ver_todos: false }} index={2} />);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2);
    expect(screen.queryByRole('link', { name: 'Ver todos os cursos' })).toBeNull();
  });

  it('abrindo a página (index 0): título h1 e cards h2', async () => {
    listar.mockResolvedValue(cursos);
    await renderizarServidor(<CatalogoCursosSection data={minimo} index={0} />);
    expect(screen.getByRole('heading', { level: 1, name: minimo.titulo! })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(3);
  });

  it('sem cursos no meio da página → a seção some', async () => {
    listar.mockResolvedValue([]);
    const { container } = await renderizarServidor(<CatalogoCursosSection data={completo} index={2} />);
    expect(container.querySelector('[data-section="catalogo-cursos"]')).toBeNull();
  });

  it('sem cursos abrindo a página → "Novos cursos em breve" com o e-mail da EBA', async () => {
    listar.mockResolvedValue([]);
    await renderizarServidor(<CatalogoCursosSection data={minimo} index={0} />);
    expect(screen.getByText('Novos cursos em breve')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /contato@adai\.com\.br/ })).toHaveAttribute('href', 'mailto:contato@adai.com.br');
  });

  it('Strapi falha ao listar → a seção some sem derrubar a página', async () => {
    listar.mockRejectedValue(new Error('Strapi fora'));
    const { container } = await renderizarServidor(<CatalogoCursosSection data={completo} index={2} />);
    expect(container.querySelector('[data-section="catalogo-cursos"]')).toBeNull();
  });
});
