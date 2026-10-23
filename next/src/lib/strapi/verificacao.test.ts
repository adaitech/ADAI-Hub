import { STRAPI_URL } from './client';
import { conferirVerificacao, emitirVerificacao, VerificacaoIndisponivel, verificacaoConfigurada, cancelarVerificacao } from './verificacao';

const fetchMock = jest.fn();
const tokenOriginal = process.env.STRAPI_TOKEN_VERIFICACAO;
const TOKEN = 'token-de-teste-verificacao';
const EXPIRA = new Date('2026-10-21T12:10:00Z');

const resposta = (status: number, corpo: unknown = {}) =>
  ({ ok: status >= 200 && status < 300, status, json: async () => corpo }) as Response;

let log: jest.SpyInstance[];

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock;
  process.env.STRAPI_TOKEN_VERIFICACAO = TOKEN;
  log = (['log', 'warn', 'error'] as const).map((n) => jest.spyOn(console, n).mockImplementation(() => undefined));
});
afterEach(() => log.forEach((s) => s.mockRestore()));
afterAll(() => {
  if (tokenOriginal === undefined) delete process.env.STRAPI_TOKEN_VERIFICACAO;
  else process.env.STRAPI_TOKEN_VERIFICACAO = tokenOriginal;
});

describe('emitirVerificacao', () => {
  it('POST em /api/verificacoes-eba/emitir com o token, sem cache e a validade em ISO; 201 → emitido', async () => {
    fetchMock.mockResolvedValue(resposta(201));
    expect(await emitirVerificacao({ emailHash: 'e1', codigoHash: 'c1', expiraEm: EXPIRA })).toBe('emitido');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${STRAPI_URL}/api/verificacoes-eba/emitir`);
    expect(init).toMatchObject({ method: 'POST', cache: 'no-store', headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' } });
    expect(JSON.parse(init.body)).toEqual({ emailHash: 'e1', codigoHash: 'c1', expiraEm: '2026-10-21T12:10:00.000Z' });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('429 → limite', async () => {
    fetchMock.mockResolvedValue(resposta(429));
    expect(await emitirVerificacao({ emailHash: 'e1', codigoHash: 'c1', expiraEm: EXPIRA })).toBe('limite');
  });

  it.each([401, 403, 500])('%s → VerificacaoIndisponivel', async (status) => {
    fetchMock.mockResolvedValue(resposta(status));
    await expect(emitirVerificacao({ emailHash: 'e1', codigoHash: 'c1', expiraEm: EXPIRA })).rejects.toBeInstanceOf(VerificacaoIndisponivel);
  });

  it('rede ou timeout → VerificacaoIndisponivel, sem log com o hash', async () => {
    fetchMock.mockRejectedValue(new DOMException('tempo esgotado', 'TimeoutError'));
    await expect(emitirVerificacao({ emailHash: 'hash-secreto', codigoHash: 'c1', expiraEm: EXPIRA })).rejects.toBeInstanceOf(VerificacaoIndisponivel);
    expect(JSON.stringify(log.map((s) => s.mock.calls))).not.toContain('hash-secreto');
  });
});

describe('cancelarVerificacao', () => {
  it('POST em /cancelar com o token e os dois hashes', async () => {
    fetchMock.mockResolvedValue(resposta(204));
    await cancelarVerificacao({ emailHash: 'e1', codigoHash: 'c1' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${STRAPI_URL}/api/verificacoes-eba/cancelar`);
    expect(init).toMatchObject({ method: 'POST', cache: 'no-store', headers: { Authorization: `Bearer ${TOKEN}` } });
    expect(JSON.parse(init.body)).toEqual({ emailHash: 'e1', codigoHash: 'c1' });
  });

  it('nunca lança (é só um desfazer): Strapi fora, 403 ou timeout passam em silêncio e sem log do hash', async () => {
    fetchMock.mockRejectedValue(new DOMException('tempo esgotado', 'TimeoutError'));
    await expect(cancelarVerificacao({ emailHash: 'hash-secreto', codigoHash: 'c1' })).resolves.toBeUndefined();
    fetchMock.mockResolvedValue(resposta(403));
    await expect(cancelarVerificacao({ emailHash: 'hash-secreto', codigoHash: 'c1' })).resolves.toBeUndefined();
    expect(JSON.stringify(log.map((s) => s.mock.calls))).not.toContain('hash-secreto');
  });
});

describe('conferirVerificacao', () => {
  it('POST em /conferir e devolve resultado e restantes', async () => {
    fetchMock.mockResolvedValue(resposta(200, { resultado: 'errado', restantes: 3 }));
    expect(await conferirVerificacao({ emailHash: 'e1', codigoHash: 'c1' })).toEqual({ resultado: 'errado', restantes: 3 });
    expect(fetchMock.mock.calls[0][0]).toBe(`${STRAPI_URL}/api/verificacoes-eba/conferir`);
  });

  it.each([
    ['resultado desconhecido', { resultado: 'talvez', restantes: 1 }],
    ['sem restantes', { resultado: 'ok' }],
    ['corpo vazio', null],
  ])('corpo fora do formato (%s) → VerificacaoIndisponivel', async (_n, corpo) => {
    fetchMock.mockResolvedValue(resposta(200, corpo));
    await expect(conferirVerificacao({ emailHash: 'e1', codigoHash: 'c1' })).rejects.toBeInstanceOf(VerificacaoIndisponivel);
  });
});

describe('verificacaoConfigurada', () => {
  it('sem STRAPI_TOKEN_VERIFICACAO → false e nenhuma chamada', async () => {
    delete process.env.STRAPI_TOKEN_VERIFICACAO;
    expect(verificacaoConfigurada()).toBe(false);
    await expect(emitirVerificacao({ emailHash: 'e1', codigoHash: 'c1', expiraEm: EXPIRA })).rejects.toBeInstanceOf(VerificacaoIndisponivel);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('com o token → true', () => {
    expect(verificacaoConfigurada()).toBe(true);
  });
});
