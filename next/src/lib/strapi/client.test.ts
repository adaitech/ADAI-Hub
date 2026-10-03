import { STRAPI_CACHE_TAG, STRAPI_URL, StrapiError, strapiFetch } from './client';

const fetchMock = jest.fn();
const tokenOriginal = process.env.STRAPI_API_TOKEN;

function respostaJson(corpo: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => corpo } as Response;
}

beforeEach(() => {
  fetchMock.mockReset().mockResolvedValue(respostaJson({ data: [] }));
  global.fetch = fetchMock;
  delete process.env.STRAPI_API_TOKEN;
});

afterAll(() => {
  if (tokenOriginal === undefined) delete process.env.STRAPI_API_TOKEN;
  else process.env.STRAPI_API_TOKEN = tokenOriginal;
});

describe('strapiFetch', () => {
  it('monta a URL da API com a query no formato do Strapi (qs, valores codificados)', async () => {
    await strapiFetch('pages', { filters: { slug: { $eq: 'home' } }, pagination: { pageSize: 1 } });
    const url = decodeURIComponent(fetchMock.mock.calls[0][0]);
    expect(url).toBe(`${STRAPI_URL}/api/pages?filters[slug][$eq]=home&pagination[pageSize]=1`);
  });

  it('sem query → sem "?" na URL', async () => {
    await strapiFetch('global');
    expect(fetchMock.mock.calls[0][0]).toBe(`${STRAPI_URL}/api/global`);
  });

  it('publicado: cache de 60 s com a tag "strapi" (revalidada pelo webhook) + tags da query', async () => {
    await strapiFetch('pages', {}, { tags: ['page:home'] });
    expect(fetchMock.mock.calls[0][1]).toEqual({ headers: {}, next: { revalidate: 60, tags: [STRAPI_CACHE_TAG, 'page:home'] } });
  });

  it('rascunho (draft mode): pede status=draft e não usa cache', async () => {
    await strapiFetch('pages', { filters: { slug: { $eq: 'kids' } } }, { draft: true });
    const [url, opcoes] = fetchMock.mock.calls[0];
    expect(decodeURIComponent(url)).toContain('status=draft');
    expect(opcoes).toEqual({ headers: {}, cache: 'no-store' });
  });

  it('com STRAPI_API_TOKEN → envia Bearer no header; sem token → nenhum header', async () => {
    process.env.STRAPI_API_TOKEN = 'token-de-teste';
    await strapiFetch('global');
    expect(fetchMock.mock.calls[0][1].headers).toEqual({ Authorization: 'Bearer token-de-teste' });
  });

  it('resposta não-ok → StrapiError com o status (a página decide: 404 vira "não encontrado")', async () => {
    fetchMock.mockResolvedValue(respostaJson({}, 404));
    const erro = await strapiFetch('global').catch((e: unknown) => e);
    expect(erro).toBeInstanceOf(StrapiError);
    expect(erro).toMatchObject({ status: 404, message: 'Strapi respondeu 404 para /api/global' });
  });

  it('devolve o JSON da resposta', async () => {
    fetchMock.mockResolvedValue(respostaJson({ data: { id: 1 } }));
    await expect(strapiFetch('global')).resolves.toEqual({ data: { id: 1 } });
  });
});
