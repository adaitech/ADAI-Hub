/**
 * `/eba/resultado/[codigo]` ponta a ponta no servidor, sem rede: token opaco, API da EBA simulada
 * (fixtures reais) e as garantias de privacidade da spec `2026-10-22-migracao-eba-3-resultado-design.md` §4.
 */
import { screen, within } from '@testing-library/react';
import { draftMode, headers } from 'next/headers';
import PedirPage, { generateMetadata as metadataPedir } from '@/app/(site)/eba/resultado/page';
import ResultadoPage, { generateMetadata } from '@/app/(site)/eba/resultado/[codigo]/page';
import TestesPage from '@/app/(site)/eba/testes/page';
import hero from '@/components/sections/HeroSection/HeroSection.mock.json';
import listaTestes from '@/components/sections/ListaTestesSection/ListaTestesSection.mock.json';
import { criarStrapiFake } from '@/test-utils/strapi-fake';
import { emitirLinkResultado } from '@/lib/eba/link-resultado';
import notaAluno from '@/lib/eba-api/__fixtures__/survey-result-aluno-nota.json';
import temperamento from '@/lib/eba-api/__fixtures__/survey-response-temperamento.json';
import { TESTES } from '@/lib/eba-api/testes';
import { renderizarServidor } from '@/test-utils/servidor';

jest.mock('next/headers', () => ({
  headers: jest.fn(),
  cookies: jest.fn(),
  draftMode: jest.fn(),
}));
jest.mock('@/lib/analytics/datalayer', () => ({ registrarEvento: jest.fn() }));

const API = 'https://eba-api.exemplo.test';
const SEGREDO = 'segredo-do-resultado-com-mais-de-32-caracteres';
const ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
const ORIGINAL = { ...process.env };
const DIA = 86_400_000;

let ip = 0;
let api: jest.Mock;
let feitos: Record<string, unknown>;

const codigoValido = (validadeMs = 7 * DIA) => emitirLinkResultado(ID, { segredo: SEGREDO, validadeMs, agora: Date.now() });
const params = (codigo: string) => ({ params: Promise.resolve({ codigo }) });
const resposta = (status: number, corpo: unknown) => Promise.resolve({ ok: status < 400, status, json: async () => corpo } as Response);
async function erroDe(chamada: Promise<unknown>) {
  return (await chamada.catch((e: unknown) => e)) as { digest?: string };
}
const e404 = async (codigo: string) => (await erroDe(ResultadoPage(params(codigo)))).digest === 'NEXT_HTTP_ERROR_FALLBACK;404';

beforeEach(() => {
  document.body.innerHTML = '';
  // IP novo por teste: o limite de aberturas é por IP e vive no módulo.
  ip += 1;
  (headers as jest.Mock).mockResolvedValue(new Headers({ 'x-forwarded-for': `203.0.113.${ip}`, 'x-nonce': 'n' }));
  process.env.EBA_API_URL = API;
  process.env.EBA_API_KEY = 'chave-de-teste';
  process.env.EBA_RESULTADO_SEGREDO = SEGREDO;
  feitos = { [TESTES[0].idQuestion]: notaAluno, [TESTES[4].idQuestion]: temperamento };
  api = jest.fn((url: string) => {
    const id = /Question\/([^/?]+)/.exec(url)?.[1] ?? '';
    return id in feitos ? resposta(200, feitos[id]) : resposta(404, { Erros: [{ Code: 'SurveyResponseNotFound' }] });
  });
  globalThis.fetch = api as unknown as typeof fetch;
});
afterAll(() => {
  process.env = ORIGINAL;
});

describe('/eba/resultado — pedido do link', () => {
  it('ligada: h1 único "Receber meu resultado", trilha, e-mail, noindex e seção medida', async () => {
    const { container } = await renderizarServidor(PedirPage());
    expect(screen.getAllByRole('heading', { level: 1 }).map((h) => h.textContent)).toEqual(['Receber meu resultado']);
    expect(within(screen.getByRole('navigation', { name: 'Trilha' })).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['ADAI', 'EBA', 'Testes', 'Receber meu resultado']);
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
    expect(container.querySelector('[data-section="pedir-resultado-eba"]')).not.toBeNull();
    expect((await metadataPedir()).robots).toEqual({ index: false, follow: false });
  });

  it('desligada (sem EBA_RESULTADO_SEGREDO) → 404', () => {
    delete process.env.EBA_RESULTADO_SEGREDO;
    expect(() => PedirPage()).toThrow(expect.objectContaining({ digest: 'NEXT_HTTP_ERROR_FALLBACK;404' }));
  });
});

describe('faixa "Consultar meus resultados" em /eba/testes', () => {
  beforeEach(() => {
    (draftMode as jest.Mock).mockResolvedValue({ isEnabled: false });
    const strapi = criarStrapiFake();
    strapi.paginas['eba-testes'] = {
      id: 9,
      documentId: 'eba-testes',
      titulo: 'Testes',
      slug: 'eba-testes',
      seo: { id: 1, metaTitle: 'Testes da EBA | ADAI', metaDescription: 'Os 5 testes do CDV.' },
      sections: [{ ...hero.unidade, id: 61 }, listaTestes.completo],
    };
    globalThis.fetch = jest.fn((url: string, init?: RequestInit) => strapi.fetch(url, init)) as unknown as typeof fetch;
  });

  it('ligada: aparece logo depois da trilha, antes do hero, com o link para /eba/resultado', async () => {
    const { container } = await renderizarServidor(await TestesPage());
    const link = screen.getByRole('link', { name: 'Consultar meus resultados' });
    expect(link).toHaveAttribute('href', '/eba/resultado');
    const trilha = screen.getByRole('navigation', { name: 'Trilha' });
    const faixa = container.querySelector('[data-section="consultar-resultado"]')!;
    expect(trilha.compareDocumentPosition(faixa) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('desligada: a faixa não aparece (nenhum link leva a uma página que daria 404)', async () => {
    delete process.env.EBA_RESULTADO_SEGREDO;
    await renderizarServidor(await TestesPage());
    expect(screen.queryByRole('link', { name: 'Consultar meus resultados' })).toBeNull();
  });
});

describe('/eba/resultado/[codigo]', () => {
  it('código válido: um h1, um h2 por teste feito, na ordem da apostila, e a seção medida', async () => {
    const { container } = await renderizarServidor(await ResultadoPage(params(codigoValido())));
    expect(screen.getAllByRole('heading', { level: 1 }).map((h) => h.textContent)).toEqual(['Seu resultado nos testes do CDV']);
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['Dons de serviço prático', 'Temperamento pessoal']);
    expect(container.querySelector('[data-section="resultado-eba"]')).not.toBeNull();
    expect(within(screen.getAllByRole('list')[0]).getAllByRole('listitem').length).toBeGreaterThan(0);
  });

  it('chama o APIM só no servidor, com a chave no header e o id do código decifrado', async () => {
    await renderizarServidor(await ResultadoPage(params(codigoValido())));
    expect(api).toHaveBeenCalledTimes(5);
    const [url, init] = api.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(`/SurveyResult/Student/${ID}/Question/`);
    expect((init.headers as Record<string, string>)['Ocp-Apim-Subscription-Key']).toBe('chave-de-teste');
  });

  it('privacidade: o HTML não tem o id do aluno, o código, nome, e-mail ou turma', async () => {
    const codigo = codigoValido();
    const { container } = await renderizarServidor(await ResultadoPage(params(codigo)));
    const html = container.innerHTML;
    expect(html).not.toContain(ID);
    expect(html).not.toContain(codigo);
    expect(html).not.toMatch(/@|Turma|e-mail/i);
    expect(api.mock.calls.every(([u]) => !String(u).includes('/Student/email') && !/\/Student\/[^/]+$/.test(String(u)))).toBe(true);
  });

  it('a página só mostra links internos dos testes (nunca o endereço do próprio resultado)', async () => {
    const codigo = codigoValido();
    await renderizarServidor(await ResultadoPage(params(codigo)));
    for (const a of screen.getAllByRole('link')) {
      expect(a.getAttribute('href')).toMatch(/^\/eba\/testes/);
    }
  });

  it('metadata: noindex, nofollow, sem referrer, sem canonical com o código', async () => {
    const meta = await generateMetadata();
    expect(meta.robots).toEqual({ index: false, follow: false });
    expect(meta.referrer).toBe('no-referrer');
    expect(JSON.stringify(meta)).not.toContain(ID);
  });

  it.each([['lixo'], [''], ['v1.AAAA'], ['3fa85f64-5717-4562-b3fc-2c963f66afa6']])('código inválido (%p) → 404 sem chamar a API', async (codigo) => {
    expect(await e404(codigo)).toBe(true);
    expect(api).not.toHaveBeenCalled();
  });

  it('código adulterado → 404', async () => {
    const codigo = codigoValido();
    const adulterado = codigo.slice(0, -2) + (codigo.endsWith('AA') ? 'BB' : 'AA');
    expect(await e404(adulterado)).toBe(true);
  });

  it('código expirado → 404', async () => {
    const codigo = emitirLinkResultado(ID, { segredo: SEGREDO, validadeMs: DIA, agora: Date.now() - 2 * DIA });
    expect(await e404(codigo)).toBe(true);
  });

  it('sem EBA_RESULTADO_SEGREDO (ou curto) a rota fica desligada: 404 mesmo com código bom', async () => {
    const codigo = codigoValido();
    delete process.env.EBA_RESULTADO_SEGREDO;
    expect(await e404(codigo)).toBe(true);
    process.env.EBA_RESULTADO_SEGREDO = 'curto';
    expect(await e404(codigo)).toBe(true);
    expect(api).not.toHaveBeenCalled();
  });

  it('aluno sem nenhum teste feito → o mesmo 404', async () => {
    feitos = {};
    expect(await e404(codigoValido())).toBe(true);
  });

  it('API fora ou sem autorização (401) → "indisponível", sem dado pessoal e sem 404', async () => {
    api.mockImplementation(() => resposta(401, {}));
    const { container } = await renderizarServidor(await ResultadoPage(params(codigoValido())));
    expect(screen.getByRole('heading', { level: 1, name: 'Seu resultado nos testes do CDV' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Resultado indisponível no momento');
    expect(container.innerHTML).not.toContain(ID);
  });

  it('API da EBA não configurada → "indisponível" para código válido', async () => {
    delete process.env.EBA_API_KEY;
    await renderizarServidor(await ResultadoPage(params(codigoValido())));
    expect(screen.getByRole('status')).toHaveTextContent('Resultado indisponível no momento');
    expect(api).not.toHaveBeenCalled();
  });

  it('limite de tentativas: depois de 20 aberturas por minuto no mesmo IP, até o código bom dá 404 (e não chama a API)', async () => {
    const codigo = codigoValido();
    for (let i = 0; i < 20; i += 1) await e404('lixo');
    api.mockClear();
    expect(await e404(codigo)).toBe(true);
    expect(api).not.toHaveBeenCalled();
  });

  it('o limite é por IP: outro IP não é afetado', async () => {
    for (let i = 0; i < 21; i += 1) await e404('lixo');
    (headers as jest.Mock).mockResolvedValue(new Headers({ 'x-forwarded-for': '198.51.100.9' }));
    await renderizarServidor(await ResultadoPage(params(codigoValido())));
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('nenhum log com id, código ou IP quando a API falha', async () => {
    const aviso = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    api.mockImplementation(() => resposta(500, {}));
    const codigo = codigoValido();
    await renderizarServidor(await ResultadoPage(params(codigo)));
    const texto = JSON.stringify(aviso.mock.calls);
    expect(texto).not.toContain(ID);
    expect(texto).not.toContain(codigo);
    expect(texto).not.toContain('203.0.113');
    aviso.mockRestore();
  });
});
