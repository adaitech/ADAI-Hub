/** @jest-environment node */
import {
  ebaApiConfigurada,
  ebaFetch,
  EbaApiError,
  EbaApiIndisponivel,
  EbaApiRespostaInvalida,
  TIMEOUT_ACAO_MS,
  TIMEOUT_AQUECER_MS,
  TIMEOUT_ENVIO_MS,
  TIMEOUT_PAGINA_MS,
} from './client';

const URL_BASE = 'https://eba-adai-api.azure-api.net';
const KEY = 'chave-apim-teste';

describe('ebaFetch', () => {
  const fetchOriginal = global.fetch;
  const envOriginal = { ...process.env };
  let fetchMock: jest.Mock;

  beforeEach(() => {
    Object.assign(process.env, { EBA_API_URL: URL_BASE, EBA_API_KEY: KEY });
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });
  afterEach(() => {
    global.fetch = fetchOriginal;
    process.env = { ...envOriginal };
  });

  it('monta a URL com o prefixo /api/v1/eba, sem barra dupla', async () => {
    process.env.EBA_API_URL = `${URL_BASE}/`;
    fetchMock.mockResolvedValue(new Response('[]', { status: 200 }));
    await ebaFetch('/Question/abc');
    expect(String(fetchMock.mock.calls[0][0])).toBe(`${URL_BASE}/api/v1/eba/Question/abc`);
  });

  it('envia a chave no header e nunca na URL', async () => {
    fetchMock.mockResolvedValue(new Response('[]', { status: 200 }));
    await ebaFetch('ClassEBA');
    const [url, init] = fetchMock.mock.calls[0];
    expect(init.headers['Ocp-Apim-Subscription-Key']).toBe(KEY);
    expect(String(url)).not.toContain(KEY);
  });

  it('GET leva next { revalidate, tags } e não força no-store', async () => {
    fetchMock.mockResolvedValue(new Response('[]', { status: 200 }));
    await ebaFetch('ClassEBA', { cache: { revalidate: 3600, tags: ['eba'] } });
    const init = fetchMock.mock.calls[0][1];
    expect(init.method).toBe('GET');
    expect(init.next).toEqual({ revalidate: 3600, tags: ['eba'] });
    expect(init.cache).toBeUndefined();
    expect(init.body).toBeUndefined();
  });

  it('POST leva Content-Type JSON, corpo serializado e cache no-store', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 200 }));
    await ebaFetch('Student', { metodo: 'POST', corpo: { name: 'Ana', email: 'ana@exemplo.com' } });
    const init = fetchMock.mock.calls[0][1];
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(init.body).toBe(JSON.stringify({ name: 'Ana', email: 'ana@exemplo.com' }));
    expect(init.cache).toBe('no-store');
    expect(init.next).toBeUndefined();
  });

  it('devolve o JSON da resposta', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: 1 }), { status: 200 }));
    await expect(ebaFetch<{ ok: number }>('x')).resolves.toEqual({ ok: 1 });
  });

  it('timeout de 10 s vira EbaApiIndisponivel', async () => {
    fetchMock.mockRejectedValue(Object.assign(new Error('timeout'), { name: 'TimeoutError' }));
    await expect(ebaFetch('x')).rejects.toBeInstanceOf(EbaApiIndisponivel);
    expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });

  it('usa AbortSignal.timeout(10_000)', async () => {
    const espiao = jest.spyOn(AbortSignal, 'timeout');
    fetchMock.mockResolvedValue(new Response('[]', { status: 200 }));
    await ebaFetch('x');
    expect(espiao).toHaveBeenCalledWith(10_000);
    espiao.mockRestore();
  });

  it('GET sem cache leva cache no-store e nenhum next', async () => {
    fetchMock.mockResolvedValue(new Response('[]', { status: 200 }));
    await ebaFetch('ClassEBA?page-size=1');
    const init = fetchMock.mock.calls[0][1];
    expect(init.method).toBe('GET');
    expect(init.cache).toBe('no-store');
    expect(init.next).toBeUndefined();
  });

  it.each([
    ['GET', {}],
    ['POST', { metodo: 'POST' as const, corpo: {} }],
  ])('%s: timeoutMs é repassado a AbortSignal.timeout', async (_m, init) => {
    const espiao = jest.spyOn(AbortSignal, 'timeout');
    fetchMock.mockResolvedValue(new Response('{}', { status: 200 }));
    await ebaFetch('x', { ...init, timeoutMs: 45_000 });
    expect(espiao).toHaveBeenCalledWith(45_000);
    expect(espiao).not.toHaveBeenCalledWith(10_000);
    espiao.mockRestore();
  });

  it('constantes de timeout: página 10 s, ação 45 s, envio 60 s, aquecimento 8 s', () => {
    expect(TIMEOUT_AQUECER_MS).toBe(8_000);
    expect(TIMEOUT_PAGINA_MS).toBe(10_000);
    expect(TIMEOUT_ACAO_MS).toBe(45_000);
    expect(TIMEOUT_ENVIO_MS).toBe(60_000);
  });

  it('GET 2xx com corpo vazio ou não JSON vira EbaApiIndisponivel (nada foi gravado)', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 200 }));
    await expect(ebaFetch('x')).rejects.toBeInstanceOf(EbaApiIndisponivel);
  });

  it('GET: timeout durante a leitura do corpo vira EbaApiIndisponivel', async () => {
    const resposta = { ok: true, status: 200, json: () => Promise.reject(Object.assign(new Error('x'), { name: 'TimeoutError' })) };
    fetchMock.mockResolvedValue(resposta);
    const erro = (await ebaFetch('x').catch((e: unknown) => e)) as Error;
    expect(erro).toBeInstanceOf(EbaApiIndisponivel);
    expect(erro.message).toContain('timeout');
  });

  it.each([
    ['vazio 200', '', 200],
    ['vazio 201', '', 201],
    ['HTML 200', '<html>APIM</html>', 200],
    ['texto 200', 'ok', 200],
  ])('POST 2xx com corpo ilegível (%s) vira EbaApiRespostaInvalida: a API já gravou', async (_caso, corpo, status) => {
    fetchMock.mockResolvedValue(new Response(corpo, { status }));
    const erro = await ebaFetch('SurveyResponse', { metodo: 'POST', corpo: {} }).catch((e: unknown) => e);
    expect(erro).toBeInstanceOf(EbaApiRespostaInvalida);
    expect(erro).not.toBeInstanceOf(EbaApiIndisponivel);
  });

  it('POST 204 (sem corpo) vira EbaApiRespostaInvalida', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await expect(ebaFetch('SurveyResponse', { metodo: 'POST', corpo: {} })).rejects.toBeInstanceOf(EbaApiRespostaInvalida);
  });

  it('POST 2xx com timeout na leitura do corpo vira EbaApiRespostaInvalida, sem vazar dados', async () => {
    const resposta = { ok: true, status: 200, json: () => Promise.reject(Object.assign(new Error('x'), { name: 'TimeoutError' })) };
    fetchMock.mockResolvedValue(resposta);
    const erro = (await ebaFetch('Student', { metodo: 'POST', corpo: { email: 'ana@exemplo.com' } }).catch((e: unknown) => e)) as Error;
    expect(erro).toBeInstanceOf(EbaApiRespostaInvalida);
    expect(erro.message).toContain('timeout');
    expect(erro.message).not.toContain('ana@exemplo.com');
    expect(erro.message).not.toContain(KEY);
  });

  it('falha de rede vira EbaApiIndisponivel', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));
    await expect(ebaFetch('x')).rejects.toBeInstanceOf(EbaApiIndisponivel);
  });

  it('sem variáveis: ebaApiConfigurada() é false e o fetch não é chamado', async () => {
    delete process.env.EBA_API_URL;
    delete process.env.EBA_API_KEY;
    expect(ebaApiConfigurada()).toBe(false);
    await expect(ebaFetch('x')).rejects.toBeInstanceOf(EbaApiIndisponivel);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('com variáveis, ebaApiConfigurada() é true', () => {
    expect(ebaApiConfigurada()).toBe(true);
  });

  it.each([
    [400, 'EmailInvalido', { Erros: [{ Code: 'EmailInvalido', Message: 'x' }] }],
    [404, null, { Erros: [] }],
    [500, null, 'texto não JSON'],
  ])('HTTP %s vira EbaApiError com código %s', async (status, codigo, corpo) => {
    fetchMock.mockResolvedValue(new Response(typeof corpo === 'string' ? corpo : JSON.stringify(corpo), { status }));
    const erro = await ebaFetch('x').catch((e: unknown) => e);
    expect(erro).toBeInstanceOf(EbaApiError);
    expect((erro as EbaApiError).status).toBe(status);
    expect((erro as EbaApiError).codigo).toBe(codigo);
  });

  it('a mensagem de erro não vaza o corpo enviado nem a chave', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ Erros: [{ Code: 'Duplicado', Message: 'ana@exemplo.com já existe' }] }), { status: 409 }));
    const erro = (await ebaFetch('Student', { metodo: 'POST', corpo: { email: 'ana@exemplo.com' } }).catch((e: unknown) => e)) as Error;
    expect(erro.message).not.toContain('ana@exemplo.com');
    expect(erro.message).not.toContain(KEY);
  });

  it('erro de indisponibilidade não vaza chave nem corpo', async () => {
    fetchMock.mockRejectedValue(new Error(`falha com ${KEY} e ana@exemplo.com`));
    const erro = (await ebaFetch('Student', { metodo: 'POST', corpo: { email: 'ana@exemplo.com' } }).catch((e: unknown) => e)) as Error;
    expect(erro.message).not.toContain('ana@exemplo.com');
    expect(erro.message).not.toContain(KEY);
  });
});

describe('EbaApiRespostaInvalida', () => {
  it('é um Error com nome próprio e só o motivo na mensagem', () => {
    const erro = new EbaApiRespostaInvalida('Student sem id');
    expect(erro).toBeInstanceOf(Error);
    expect(erro.name).toBe('EbaApiRespostaInvalida');
    expect(erro.message).toBe('[eba-api] resposta inválida: Student sem id');
  });
});

describe('ebaFetch: chamadas da equipe (bearer, raiz, PUT e DELETE)', () => {
  const fetchOriginal = global.fetch;
  const envOriginal = { ...process.env };
  let fetchMock: jest.Mock;

  beforeEach(() => {
    Object.assign(process.env, { EBA_API_URL: URL_BASE, EBA_API_KEY: KEY });
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });
  afterEach(() => {
    global.fetch = fetchOriginal;
    process.env = { ...envOriginal };
  });

  it('bearer: Authorization: Bearer no header, além da chave do APIM, e nunca na URL', async () => {
    fetchMock.mockResolvedValue(new Response('[]', { status: 200 }));
    await ebaFetch('Student', { bearer: 'token-da-equipe' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBe('Bearer token-da-equipe');
    expect(init.headers['Ocp-Apim-Subscription-Key']).toBe(KEY);
    expect(String(url)).not.toContain('token-da-equipe');
  });

  it('sem bearer não manda Authorization', async () => {
    fetchMock.mockResolvedValue(new Response('[]', { status: 200 }));
    await ebaFetch('Student');
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it('raiz: o caminho não leva o prefixo /api/v1/eba (ex.: /login do Identity)', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 200 }));
    await ebaFetch('login', { metodo: 'POST', corpo: {}, raiz: true });
    expect(String(fetchMock.mock.calls[0][0])).toBe(`${URL_BASE}/login`);
  });

  it('PUT leva corpo JSON e cache no-store', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 200 }));
    await ebaFetch('ClassEBA', { metodo: 'PUT', corpo: { id: 'x' } });
    const init = fetchMock.mock.calls[0][1];
    expect(init.method).toBe('PUT');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(init.body).toBe(JSON.stringify({ id: 'x' }));
    expect(init.cache).toBe('no-store');
  });

  it('DELETE não leva corpo nem Content-Type, e usa cache no-store', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 200 }));
    await ebaFetch('ClassEBA/abc', { metodo: 'DELETE' });
    const init = fetchMock.mock.calls[0][1];
    expect(init.method).toBe('DELETE');
    expect(init.body).toBeUndefined();
    expect(init.headers['Content-Type']).toBeUndefined();
    expect(init.cache).toBe('no-store');
  });

  it.each(['PUT', 'DELETE'] as const)('%s 2xx com corpo ilegível vira EbaApiRespostaInvalida (a API já alterou)', async (metodo) => {
    fetchMock.mockResolvedValue(new Response('', { status: 200 }));
    const erro = await ebaFetch('ClassEBA', { metodo, corpo: {} }).catch((e: unknown) => e);
    expect(erro).toBeInstanceOf(EbaApiRespostaInvalida);
  });

  it('401 vira EbaApiError com status 401, sem o bearer na mensagem', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 401 }));
    const erro = (await ebaFetch('Student', { bearer: 'token-secreto' }).catch((e: unknown) => e)) as EbaApiError;
    expect(erro).toBeInstanceOf(EbaApiError);
    expect(erro.status).toBe(401);
    expect(erro.message).not.toContain('token-secreto');
  });
});
