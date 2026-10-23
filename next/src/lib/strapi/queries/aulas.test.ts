import fixture from '@/lib/eba/__fixtures__/aulas.json';
import { StrapiError } from '../client';
import { listarAulasDoCurso } from './aulas';

const fetchMock = jest.fn();
const ok = (corpo: unknown) => ({ ok: true, status: 200, json: async () => corpo }) as Response;
const ORIGINAL = { geral: process.env.STRAPI_API_TOKEN, aulas: process.env.STRAPI_TOKEN_AULAS };

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock;
  process.env.STRAPI_TOKEN_AULAS = 'token-do-strapi-de-teste';
  delete process.env.STRAPI_API_TOKEN;
});
afterAll(() => {
  if (ORIGINAL.geral === undefined) delete process.env.STRAPI_API_TOKEN;
  else process.env.STRAPI_API_TOKEN = ORIGINAL.geral;
  if (ORIGINAL.aulas === undefined) delete process.env.STRAPI_TOKEN_AULAS;
  else process.env.STRAPI_TOKEN_AULAS = ORIGINAL.aulas;
});

describe('listarAulasDoCurso', () => {
  it('pede as aulas publicadas do curso com a foto do autor, tag aulas e o token (tipo privado), e devolve na ordem', async () => {
    fetchMock.mockResolvedValue(ok(fixture));
    const aulas = await listarAulasDoCurso('dna');
    expect(aulas.map((a) => a.endereco)).toEqual(['boas-vindas', 'aula-01', 'aula-02']);
    const [url, init] = fetchMock.mock.calls[0];
    const decodificada = decodeURIComponent(url);
    expect(decodificada).toContain('/api/aulas?');
    expect(decodificada).toContain('filters[curso][$eq]=dna');
    expect(decodificada).toContain('populate[foto_autor]=true');
    expect(decodificada).toContain('pagination[pageSize]=100');
    expect(decodificada).not.toContain('status=draft');
    expect(init.headers).toMatchObject({ Authorization: 'Bearer token-do-strapi-de-teste' });
    expect(init.next.tags).toEqual(expect.arrayContaining(['strapi', 'aulas']));
    expect(url).not.toContain('token-do-strapi');
  });

  it('descarta aulas inválidas (vídeo de outro site) e as de outro curso que escaparem do filtro', async () => {
    fetchMock.mockResolvedValue(ok({ ...fixture, data: [{ ...fixture.data[0], video_url: 'https://evil.com/x' }, { ...fixture.data[1], curso: 'reset' }, fixture.data[2]] }));
    expect((await listarAulasDoCurso('dna')).map((a) => a.endereco)).toEqual(['aula-02']);
  });

  it('sem STRAPI_TOKEN_AULAS usa o STRAPI_API_TOKEN (token de leitura geral)', async () => {
    delete process.env.STRAPI_TOKEN_AULAS;
    process.env.STRAPI_API_TOKEN = 'token-geral';
    fetchMock.mockResolvedValue(ok(fixture));
    await listarAulasDoCurso('dna');
    expect(fetchMock.mock.calls[0][1].headers).toMatchObject({ Authorization: 'Bearer token-geral' });
  });

  it('curso que não é dna nem reset → lista vazia, sem chamar o Strapi', async () => {
    expect(await listarAulasDoCurso('start' as never)).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('Strapi recusa (sem token → 403) ou cai (500) → lança StrapiError', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 403 } as Response);
    await expect(listarAulasDoCurso('dna')).rejects.toBeInstanceOf(StrapiError);
    fetchMock.mockResolvedValue({ ok: false, status: 500 } as Response);
    await expect(listarAulasDoCurso('reset')).rejects.toBeInstanceOf(StrapiError);
  });
});
