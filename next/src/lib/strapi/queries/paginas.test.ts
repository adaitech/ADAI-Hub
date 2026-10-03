import { listarPaginasPublicadas } from './paginas';

const fetchMock = jest.fn();

function resposta(paginas: { slug: string }[], page: number, pageCount: number) {
  return { ok: true, status: 200, json: async () => ({ data: paginas, meta: { pagination: { page, pageSize: 100, pageCount, total: 0 } } }) } as Response;
}

const urlDa = (chamada: number) => decodeURIComponent(fetchMock.mock.calls[chamada][0]);

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock;
});

describe('listarPaginasPublicadas', () => {
  it('pede só o necessário para o sitemap: slug, data de atualização e o SEO de robots/canonical', async () => {
    fetchMock.mockResolvedValue(resposta([{ slug: 'home' }], 1, 1));
    await expect(listarPaginasPublicadas()).resolves.toEqual([{ slug: 'home' }]);
    const url = urlDa(0);
    expect(url).toContain('/api/pages?');
    expect(url).toContain('fields[0]=slug');
    expect(url).toContain('fields[1]=updatedAt');
    expect(url).toContain('populate[seo][fields][0]=metaRobots');
    expect(url).toContain('populate[seo][fields][1]=canonicalURL');
    expect(url).toContain('pagination[page]=1');
    expect(url).not.toContain('status=draft');
  });

  it('percorre todas as páginas da paginação do Strapi', async () => {
    fetchMock
      .mockResolvedValueOnce(resposta([{ slug: 'home' }], 1, 2))
      .mockResolvedValueOnce(resposta([{ slug: 'kids' }], 2, 2));
    await expect(listarPaginasPublicadas()).resolves.toEqual([{ slug: 'home' }, { slug: 'kids' }]);
    expect(urlDa(1)).toContain('pagination[page]=2');
  });

  it('usa o cache do Strapi (tag "strapi"): publicar no painel atualiza o sitemap pelo webhook', async () => {
    fetchMock.mockResolvedValue(resposta([], 1, 1));
    await listarPaginasPublicadas();
    expect(fetchMock.mock.calls[0][1].next.tags).toContain('strapi');
  });

  it('trava de segurança: no máximo 20 páginas de 100 (2.000 URLs) mesmo com paginação errada', async () => {
    fetchMock.mockImplementation(async () => resposta([{ slug: 'x' }], 1, 999));
    await listarPaginasPublicadas();
    expect(fetchMock).toHaveBeenCalledTimes(20);
  });
});
