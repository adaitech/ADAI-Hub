/** @jest-environment node */
import { ebaApiConfigurada, ebaFetch, EbaApiError, EbaApiIndisponivel, EbaApiRespostaInvalida } from './client';

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

  it('2xx com corpo vazio ou não JSON vira EbaApiIndisponivel', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 200 }));
    await expect(ebaFetch('x')).rejects.toBeInstanceOf(EbaApiIndisponivel);
  });

  it('timeout durante a leitura do corpo vira EbaApiIndisponivel', async () => {
    const resposta = { ok: true, status: 200, json: () => Promise.reject(Object.assign(new Error('x'), { name: 'TimeoutError' })) };
    fetchMock.mockResolvedValue(resposta);
    const erro = (await ebaFetch('x').catch((e: unknown) => e)) as Error;
    expect(erro).toBeInstanceOf(EbaApiIndisponivel);
    expect(erro.message).toContain('timeout');
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
