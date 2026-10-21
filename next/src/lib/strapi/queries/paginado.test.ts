import { listarPaginado } from './paginado';

const fetchMock = jest.fn();
const resposta = (itens: unknown[], page: number, pageCount: number) =>
  ({ ok: true, status: 200, json: async () => ({ data: itens, meta: { pagination: { page, pageSize: 100, pageCount, total: 0 } } }) }) as Response;
const urlDa = (chamada: number) => decodeURIComponent(fetchMock.mock.calls[chamada][0]);

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock;
});

describe('listarPaginado', () => {
  it('percorre todas as páginas da paginação do Strapi, de 100 em 100, com a query e as tags', async () => {
    fetchMock.mockResolvedValueOnce(resposta([{ slug: 'a' }], 1, 2)).mockResolvedValueOnce(resposta([{ slug: 'b' }], 2, 2));
    await expect(listarPaginado('cursos', { fields: ['slug'] }, ['cursos'])).resolves.toEqual([{ slug: 'a' }, { slug: 'b' }]);
    expect(urlDa(0)).toContain('/api/cursos?');
    expect(urlDa(0)).toContain('fields[0]=slug');
    expect(urlDa(1)).toContain('pagination[page]=2');
    expect(urlDa(1)).toContain('pagination[pageSize]=100');
    expect(fetchMock.mock.calls[0][1].next.tags).toEqual(['strapi', 'cursos']);
  });

  it('trava de segurança: no máximo 20 páginas mesmo com paginação errada', async () => {
    fetchMock.mockImplementation(async () => resposta([{ slug: 'x' }], 1, 999));
    await listarPaginado('pages', {});
    expect(fetchMock).toHaveBeenCalledTimes(20);
  });
});
