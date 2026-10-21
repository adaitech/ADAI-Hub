/**
 * Rotas dos testes da EBA ponta a ponta no servidor, sem rede:
 * - `/eba/testes` → página "eba-testes" do Strapi (a rota estática `testes/` tem precedência sobre `/eba/[slug]`);
 * - `/eba/testes/[slug]` → textos da abertura do Strapi (tipo `teste`) + perguntas da API da EBA
 *   (APIM simulado com os fixtures reais) + sessão (cookie) → Questionário.
 */
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { cookies, draftMode, headers } from 'next/headers';
import TestesPage, { generateMetadata as metadataTestes } from '@/app/(site)/eba/testes/page';
import TestePage, { generateMetadata as metadataTeste, maxDuration } from '@/app/(site)/eba/testes/[slug]/page';
import hero from '@/components/sections/HeroSection/HeroSection.mock.json';
import listaTestes from '@/components/sections/ListaTestesSection/ListaTestesSection.mock.json';
import { assinarSessao, COOKIE_SESSAO } from '@/lib/eba/sessao';
import questaoMinisterio from '@/lib/eba-api/__fixtures__/question-dons-ministerio.json';
import questaoServico from '@/lib/eba-api/__fixtures__/question-dons-servico.json';
import questaoTalentos from '@/lib/eba-api/__fixtures__/question-talentos-naturais.json';
import questaoTemperamento from '@/lib/eba-api/__fixtures__/question-temperamento-pessoal.json';
import { TESTES } from '@/lib/eba-api/testes';
import { renderizarServidor } from '@/test-utils/servidor';
import { criarStrapiFake } from '@/test-utils/strapi-fake';

jest.mock('next/headers', () => ({
  draftMode: jest.fn(),
  cookies: jest.fn(),
  headers: jest.fn(async () => new Headers({ 'x-nonce': 'nonce-de-teste' })),
}));
jest.mock('@/lib/analytics/datalayer', () => ({ registrarEvento: jest.fn() }));

const API = 'https://eba-api.exemplo.test';
const SEGREDO = 'segredo-de-teste-com-mais-de-32-caracteres';
const QUESTOES: Record<string, unknown> = Object.fromEntries(
  [questaoServico, questaoMinisterio, questaoTalentos, questaoTemperamento].map((q) => [q[0].id, q]),
);
const RESUMO_PADRAO = 'Responda com sinceridade, pensando em como você é hoje.';

let strapi: ReturnType<typeof criarStrapiFake>;
let api: jest.Mock;
let cookieSessao: string | undefined;
const ORIGINAL = { ...process.env };

const responder = (status: number, corpo: unknown) => Promise.resolve({ ok: status < 400, status, json: async () => corpo } as Response);

beforeEach(() => {
  jest.clearAllMocks();
  // renderizarServidor escreve direto no body; os testes com `render` (cliques) precisam dele limpo.
  document.body.innerHTML = '';
  (draftMode as jest.Mock).mockResolvedValue({ isEnabled: false });
  cookieSessao = undefined;
  (cookies as jest.Mock).mockImplementation(async () => ({
    get: (nome: string) => (nome === COOKIE_SESSAO && cookieSessao ? { value: cookieSessao } : undefined),
  }));
  process.env.NEXT_PUBLIC_SITE_URL = 'https://adai.com.br';
  process.env.EBA_API_URL = API;
  process.env.EBA_API_KEY = 'chave-de-teste';
  process.env.EBA_SESSAO_SEGREDO = SEGREDO;
  strapi = criarStrapiFake();
  strapi.paginas['eba-testes'] = {
    id: 9,
    documentId: 'eba-testes',
    titulo: 'Testes',
    slug: 'eba-testes',
    seo: { id: 1, metaTitle: 'Testes da EBA | ADAI', metaDescription: 'Os 5 testes do CDV: dons, talentos, estilo e temperamento.' },
    sections: [{ ...hero.unidade, id: 61 }, listaTestes.completo],
  };
  api = jest.fn((url: string) => {
    const id = /Question\/([^/?]+)/.exec(url)?.[1];
    return id && QUESTOES[id] ? responder(200, QUESTOES[id]) : responder(404, {});
  });
  globalThis.fetch = jest.fn((url: string, init?: RequestInit) =>
    String(url).startsWith(API) ? api(String(url), init) : strapi.fetch(url, init),
  ) as unknown as typeof fetch;
});

afterAll(() => {
  process.env = ORIGINAL;
});

async function erroDe(chamada: Promise<unknown>) {
  return (await chamada.catch((e: unknown) => e)) as { digest?: string };
}
const params = (slug: string) => ({ params: Promise.resolve({ slug }) });
const jsonLd = (container: HTMLElement) =>
  [...container.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent ?? '{}') as { '@type': string });
const comecar = () => fireEvent.click(screen.getByRole('button', { name: /começar o teste/i }));
/** Chamadas de perguntas (`Question/...`); o aquecimento (`ClassEBA?page-size=1`) fica de fora. */
const chamadasDePerguntas = () => api.mock.calls.filter(([url]) => String(url).includes('/Question/'));

describe('/eba/testes — página do Strapi (não cai no 404 da rota dos testes)', () => {
  it('monta a página "eba-testes" com um h1, a Lista de testes, trilha e BreadcrumbList', async () => {
    const { container } = await renderizarServidor(await TestesPage());
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(container.querySelector('[data-section="lista-testes"]')).not.toBeNull();
    const trilha = screen.getByRole('navigation', { name: 'Trilha' });
    expect(within(trilha).getByRole('link', { name: 'EBA' })).toHaveAttribute('href', '/eba');
    expect(within(trilha).getByText('Testes')).toHaveAttribute('aria-current', 'page');
    expect(jsonLd(container).map((d) => d['@type'])).toContain('BreadcrumbList');
  });

  it('metadata do Strapi com canonical /eba/testes', async () => {
    const meta = await metadataTestes();
    expect(meta.alternates?.canonical).toBe('/eba/testes');
    expect(String(meta.title)).toBe('Testes da EBA | ADAI');
  });

  it('sem a página no Strapi → 404', async () => {
    delete strapi.paginas['eba-testes'];
    expect((await erroDe(TestesPage())).digest).toBe('NEXT_HTTP_ERROR_FALLBACK;404');
    expect((await metadataTestes()).robots).toMatchObject({ index: false });
  });
});

describe('/eba/testes/[slug] — tela do teste', () => {
  it.each(TESTES.map((t) => [t.slug, t.nome]))('%s: h1 com o nome, trilha ADAI › EBA › Testes › <nome> e BreadcrumbList', async (slug, nome) => {
    const { container } = await renderizarServidor(await TestePage(params(slug)));
    expect(screen.getAllByRole('heading', { level: 1 }).map((h) => h.textContent)).toEqual([nome]);
    const trilha = screen.getByRole('navigation', { name: 'Trilha' });
    expect(within(trilha).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['ADAI', 'EBA', 'Testes', nome]);
    expect(within(trilha).getByRole('link', { name: 'Testes' })).toHaveAttribute('href', '/eba/testes');
    expect(within(trilha).getByText(nome)).toHaveAttribute('aria-current', 'page');
    expect(jsonLd(container).map((d) => d['@type'])).toContain('BreadcrumbList');
    expect(container.querySelector('[data-section="teste-eba"]')).not.toBeNull();
  });

  it.each(TESTES.map((t) => [t.slug, t.nome]))('%s: metadata noindex, nofollow, canonical da tela', async (slug, nome) => {
    const meta = await metadataTeste(params(slug));
    expect(String(meta.title)).toBe(`${nome} — Testes da EBA | ADAI`);
    expect(meta.alternates?.canonical).toBe(`/eba/testes/${slug}`);
    expect(meta.robots).toEqual({ index: false, follow: false });
  });

  it('abertura vem do Strapi (nome, resumo, aula, perguntas, como responder); o nome do Strapi vale no h1 e no título', async () => {
    strapi.testes.find((t) => t.slug === 'dons-servico')!.nome = 'Dons de serviço';
    await renderizarServidor(await TestePage(params('dons-servico')));
    expect(screen.getByRole('heading', { level: 1, name: 'Dons de serviço' })).toBeInTheDocument();
    expect(screen.getByText(/dons espirituais aparecem com mais força/)).toBeInTheDocument();
    expect(screen.getByText('Aula 5 do CDV')).toBeInTheDocument();
    expect(screen.getByText('55 afirmações')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Como responder' })).toBeInTheDocument();
    const meta = await metadataTeste(params('dons-servico'));
    expect(String(meta.title)).toBe('Dons de serviço — Testes da EBA | ADAI');
    expect(meta.description).toMatch(/dons espirituais/);
  });

  it('sem o teste no Strapi → nome da lista local e resumo padrão, sem os textos opcionais', async () => {
    await renderizarServidor(await TestePage(params('dons-ministerio')));
    expect(screen.getByRole('heading', { level: 1, name: 'Dons ministeriais' })).toBeInTheDocument();
    expect(screen.getByText(RESUMO_PADRAO)).toBeInTheDocument();
    expect(screen.queryByText(/do CDV/)).toBeNull();
    expect((await metadataTeste(params('dons-ministerio'))).description).toBe(RESUMO_PADRAO);
  });

  it.each([['nao-existe'], ['cursos'], ['Dons-Servico']])('slug fora dos 5 testes (%p) → 404 sem chamar a API nem o Strapi', async (slug) => {
    expect((await erroDe(TestePage(params(slug)))).digest).toBe('NEXT_HTTP_ERROR_FALLBACK;404');
    expect((await erroDe(metadataTeste(params(slug)))).digest).toBe('NEXT_HTTP_ERROR_FALLBACK;404');
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('perguntas buscadas no servidor (APIM, chave no header) e entregues prontas: com sessão, "Começar" abre a 1ª pergunta', async () => {
    cookieSessao = assinarSessao({ idStudent: 'aluno-1', idClass: 'turma-1', emailMascarado: 'a***@exemplo.com', emitidoEm: Date.now() }, SEGREDO);
    render(await TestePage(params('dons-servico')));
    const [url, init] = api.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${API}/api/v1/eba/Question/${TESTES[0].idQuestion}`);
    expect((init.headers as Record<string, string>)['Ocp-Apim-Subscription-Key']).toBe('chave-de-teste');
    comecar();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', String(questaoServico.length));
    expect(screen.getByText(questaoServico[0].text)).toBeInTheDocument();
    expect(screen.getByText(/a\*\*\*@exemplo\.com/)).toBeInTheDocument();
  });

  it('maxDuration de 120 s no segmento (as Server Actions da página herdam: 45/60 s cabem)', () => {
    expect(maxDuration).toBe(120);
  });

  it('temperamento não usa as perguntas da API: a página não busca e, com a API fora, "Começar" segue', async () => {
    api.mockImplementation(() => responder(503, {}));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    cookieSessao = assinarSessao({ idStudent: 'aluno-1', idClass: 'turma-1', emailMascarado: 'a***@exemplo.com', emitidoEm: Date.now() }, SEGREDO);
    render(await TestePage(params('temperamento-pessoal')));
    expect(chamadasDePerguntas()).toHaveLength(0);
    comecar();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '20');
    warn.mockRestore();
  });

  it('a busca de perguntas na renderização continua com timeout de 10 s (a página não pode travar)', async () => {
    const espiao = jest.spyOn(AbortSignal, 'timeout');
    await TestePage(params('dons-servico'));
    expect(chamadasDePerguntas()).toHaveLength(1);
    expect(espiao).toHaveBeenCalledTimes(1);
    expect(espiao).toHaveBeenCalledWith(10_000);
    espiao.mockRestore();
  });

  it('ao abrir, a tela aquece a API: um GET ClassEBA?page-size=1 sem cache, com timeout curto (8 s)', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    // IP próprio: o limite do aquecimento (5 por minuto) é por IP e do módulo.
    const cabecalhos = jest.mocked(headers).getMockImplementation()!;
    jest.mocked(headers).mockImplementation(async () => new Headers({ 'x-nonce': 'nonce-de-teste', 'x-forwarded-for': '203.0.113.7' }) as never);
    const espiao = jest.spyOn(AbortSignal, 'timeout');
    render(await TestePage(params('dons-servico')));
    await act(async () => {});
    jest.mocked(headers).mockImplementation(cabecalhos);
    const aquecimento = api.mock.calls.filter(([url]) => String(url).includes('ClassEBA?page-size=1'));
    expect(aquecimento).toHaveLength(1);
    expect((aquecimento[0][1] as RequestInit).cache).toBe('no-store');
    expect(espiao).toHaveBeenCalledWith(8_000);
    espiao.mockRestore();
    warn.mockRestore();
  });

  it('API fria: a busca da página estoura os 10 s; "Começar" prepara o teste e segue com as perguntas', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    cookieSessao = assinarSessao({ idStudent: 'aluno-1', idClass: 'turma-1', emailMascarado: 'a***@exemplo.com', emitidoEm: Date.now() }, SEGREDO);
    const normal = api.getMockImplementation()!;
    api.mockImplementationOnce(() => Promise.reject(Object.assign(new Error('timeout'), { name: 'TimeoutError' })));
    render(await TestePage(params('dons-servico')));
    api.mockImplementation(normal);
    comecar();
    expect(screen.getByRole('status')).toHaveTextContent('Preparando o teste…');
    await act(async () => {});
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', String(questaoServico.length));
    expect(screen.getByText(questaoServico[0].text)).toBeInTheDocument();
    expect(chamadasDePerguntas()).toHaveLength(2);
    warn.mockRestore();
  });

  it('sem sessão, "Começar" pede o e-mail', async () => {
    render(await TestePage(params('dons-servico')));
    comecar();
    expect(screen.getByRole('textbox', { name: /e-mail/i })).toBeInTheDocument();
  });

  it('estilo pessoal: perguntas locais, sem chamar a API (lista vazia não é indisponibilidade)', async () => {
    cookieSessao = assinarSessao({ idStudent: 'aluno-1', idClass: 'turma-1', emailMascarado: 'a***@exemplo.com', emitidoEm: Date.now() }, SEGREDO);
    render(await TestePage(params('estilo-pessoal')));
    expect(chamadasDePerguntas()).toHaveLength(0);
    comecar();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});

describe('/eba/testes/[slug] — indisponibilidade (nunca 404)', () => {
  it.each([
    ['API fora do ar (503)', () => api.mockImplementation(() => responder(503, {}))],
    ['falha de rede', () => api.mockImplementation(() => Promise.reject(new TypeError('fetch failed')))],
  ])('%s: a abertura aparece e "Começar" mostra que as perguntas não carregaram', async (_caso, derrubar) => {
    derrubar();
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    render(await TestePage(params('dons-servico')));
    expect(screen.getByRole('heading', { level: 1, name: 'Dons de serviço prático' })).toBeInTheDocument();
    comecar();
    // "Começar" tenta de novo pela ação (45 s); a API continua fora.
    expect(await screen.findByRole('alert')).toHaveTextContent('Não conseguimos carregar as perguntas agora. Tente em alguns minutos.');
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument();
    expect(warn.mock.calls.flat().join(' ')).not.toContain('chave-de-teste');
    warn.mockRestore();
  });

  it.each([
    ['sem EBA_API_URL', () => delete process.env.EBA_API_URL],
    ['sem EBA_API_KEY', () => delete process.env.EBA_API_KEY],
    ['sem EBA_SESSAO_SEGREDO', () => delete process.env.EBA_SESSAO_SEGREDO],
    ['EBA_SESSAO_SEGREDO curto', () => (process.env.EBA_SESSAO_SEGREDO = 'curto')],
  ])('%s: "Testes indisponíveis no momento", link para /eba/testes, sem questionário nem API', async (_caso, tirar) => {
    tirar();
    const { container } = await renderizarServidor(await TestePage(params('dons-servico')));
    expect(screen.getByRole('heading', { level: 1, name: 'Dons de serviço prático' })).toBeInTheDocument();
    expect(screen.getByText('Testes indisponíveis no momento')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver todos os testes' })).toHaveAttribute('href', '/eba/testes');
    expect(screen.queryByRole('button', { name: /começar o teste/i })).toBeNull();
    expect(screen.getByRole('navigation', { name: 'Trilha' })).toBeInTheDocument();
    expect(container.querySelector('[data-section="teste-eba"]')).not.toBeNull();
    expect(api).not.toHaveBeenCalled();
  });
});
