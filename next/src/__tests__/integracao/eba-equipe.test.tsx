/**
 * Área da equipe ponta a ponta no servidor, sem rede (spec 2026-10-22, entrega 4): guarda de sessão, API da
 * EBA simulada com os fixtures reais e as garantias de privacidade (bearer só no servidor, sem dado pessoal na URL).
 */
import { screen, within } from '@testing-library/react';
import { cookies, headers } from 'next/headers';
import LoginPage from '@/app/(restrito)/eba/equipe/login/page';
import EquipeLayout, { metadata } from '@/app/(restrito)/eba/equipe/layout';
import EquipePage from '@/app/(restrito)/eba/equipe/page';
import ConsultasPage from '@/app/(restrito)/eba/equipe/consultas/page';
import DetalhePage from '@/app/(restrito)/eba/equipe/consultas/[idStudent]/page';
import TurmasPage from '@/app/(restrito)/eba/equipe/turmas/page';
import QrCodesPage from '@/app/(restrito)/eba/equipe/qr-codes/page';
import { abrirSessaoEquipe, COOKIE_EQUIPE } from '@/lib/eba/equipe/sessao';
import classes from '@/lib/eba-api/__fixtures__/classes.json';
import pagina from '@/lib/eba-api/__fixtures__/students-pagina.json';
import notaAluno from '@/lib/eba-api/__fixtures__/survey-result-aluno-nota.json';
import { TESTES } from '@/lib/eba-api/testes';
import { renderizarServidor } from '@/test-utils/servidor';

jest.mock('next/headers', () => ({ cookies: jest.fn(), headers: jest.fn(), draftMode: jest.fn() }));
jest.mock('next/navigation', () => ({
  ...jest.requireActual('next/navigation'),
  useRouter: () => ({ replace: jest.fn(), refresh: jest.fn() }),
  usePathname: () => '/eba/equipe/consultas',
}));
jest.mock('@/lib/analytics/datalayer', () => ({ registrarEvento: jest.fn() }));

const API = 'https://eba-api.exemplo.test';
const SEGREDO = 'segredo-da-equipe-com-mais-de-32-caracteres!';
const BEARER = 'bearer-secreto-da-equipe';
const ID = '11111111-2222-4333-8444-555555555555';
const ORIGINAL = { ...process.env };

let api: jest.Mock;
let cookieEquipe: string | undefined;

const resposta = (status: number, corpo: unknown) => Promise.resolve({ ok: status < 400, status, json: async () => corpo } as Response);
const comSessao = () => {
  cookieEquipe = abrirSessaoEquipe({ accessToken: BEARER, email: 'ana@adai.com.br', expiresIn: 3600 }, SEGREDO, Date.now()).valor;
};
async function erroDe(chamada: Promise<unknown>) {
  return (await chamada.catch((e: unknown) => e)) as { digest?: string; message?: string };
}
const e404 = (e: { digest?: string }) => e.digest === 'NEXT_HTTP_ERROR_FALLBACK;404';
const redirecionaPara = (e: { digest?: string }, destino: string) => Boolean(e.digest?.startsWith('NEXT_REDIRECT') && e.digest.includes(destino));
const props = (searchParams: Record<string, string> = {}) => ({ searchParams: Promise.resolve(searchParams) });
const turmasPaginadas = { ...classes, pages: { totalPages: 1, totalRecords: 4, requestDate: null } };

beforeEach(() => {
  document.body.innerHTML = '';
  jest.clearAllMocks();
  process.env.EBA_EQUIPE_SEGREDO = SEGREDO;
  process.env.EBA_API_URL = API;
  process.env.EBA_API_KEY = 'chave-de-teste';
  cookieEquipe = undefined;
  comSessao();
  (cookies as jest.Mock).mockImplementation(async () => ({ get: (nome: string) => (nome === COOKIE_EQUIPE && cookieEquipe ? { value: cookieEquipe } : undefined), set: jest.fn(), delete: jest.fn() }));
  (headers as jest.Mock).mockResolvedValue(new Headers({ 'x-forwarded-for': '203.0.113.5' }));
  api = jest.fn((url: string) => {
    if (url.includes('/ClassEBA?')) return resposta(200, turmasPaginadas);
    if (url.includes('/Student?')) return resposta(200, pagina);
    if (url.endsWith(`/Student/${ID}`)) return resposta(200, pagina.data[0]);
    if (url.includes('/SurveyResult/Student/')) {
      return url.includes(TESTES[0].idQuestion) ? resposta(200, notaAluno) : resposta(404, { Erros: [{ Code: 'SurveyResponseNotFound' }] });
    }
    return resposta(404, {});
  });
  globalThis.fetch = api as unknown as typeof fetch;
});
afterAll(() => {
  process.env = ORIGINAL;
});

describe('área desligada e guarda de sessão', () => {
  it('sem EBA_EQUIPE_SEGREDO: layout e páginas respondem 404 (a área não existe)', async () => {
    delete process.env.EBA_EQUIPE_SEGREDO;
    expect(e404(await erroDe(EquipeLayout({ children: null })))).toBe(true);
    expect(e404(await erroDe(ConsultasPage(props())))).toBe(true);
    expect(e404(await erroDe(TurmasPage()))).toBe(true);
    expect(e404(await erroDe(QrCodesPage()))).toBe(true);
    expect(e404(await erroDe(DetalhePage({ params: Promise.resolve({ idStudent: ID }) })))).toBe(true);
    expect(api).not.toHaveBeenCalled();
  });

  it.each([
    ['consultas', () => ConsultasPage(props())],
    ['turmas', () => TurmasPage()],
    ['qr-codes', () => QrCodesPage()],
    ['detalhe', () => DetalhePage({ params: Promise.resolve({ idStudent: ID }) })],
  ])('%s sem sessão → redireciona ao login, sem chamar a API', async (_nome, chamar) => {
    cookieEquipe = undefined;
    expect(redirecionaPara(await erroDe(chamar()), '/eba/equipe/login')).toBe(true);
    expect(api).not.toHaveBeenCalled();
  });

  it('cookie adulterado ou de outro segredo → sem sessão', async () => {
    cookieEquipe = 'v1.lixo';
    expect(redirecionaPara(await erroDe(ConsultasPage(props())), '/eba/equipe/login')).toBe(true);
    cookieEquipe = abrirSessaoEquipe({ accessToken: BEARER, email: 'ana@adai.com.br', expiresIn: 3600 }, 'outro-segredo-da-equipe-com-32-caracteres!!', Date.now()).valor;
    expect(redirecionaPara(await erroDe(TurmasPage()), '/eba/equipe/login')).toBe(true);
  });

  it('/eba/equipe → consultas', async () => {
    expect(redirecionaPara(await erroDe(Promise.resolve().then(() => EquipePage())), '/eba/equipe/consultas')).toBe(true);
  });

  it('metadata: noindex, nofollow', () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});

describe('layout e login', () => {
  it('com sessão: menu com Consultas, Turmas e o e-mail de quem entrou', async () => {
    await renderizarServidor(await EquipeLayout({ children: <p>conteúdo</p> }));
    const nav = screen.getByRole('navigation', { name: 'Área da equipe' });
    expect(within(nav).getAllByRole('link').map((a) => a.textContent)).toEqual(['Consultas', 'Turmas', 'QR codes']);
    expect(screen.getByText('ana@adai.com.br')).toBeInTheDocument();
    expect(screen.getByText('conteúdo')).toBeInTheDocument();
  });

  it('sem sessão: só o conteúdo (o login), sem menu', async () => {
    cookieEquipe = undefined;
    await renderizarServidor(await EquipeLayout({ children: <p>conteúdo</p> }));
    expect(screen.queryByRole('navigation', { name: 'Área da equipe' })).toBeNull();
  });

  it('login sem sessão: um h1, formulário e seção medida; ?motivo=sessao avisa', async () => {
    cookieEquipe = undefined;
    const { container } = await renderizarServidor(await LoginPage(props({ motivo: 'sessao' })));
    expect(screen.getAllByRole('heading', { level: 1 }).map((h) => h.textContent)).toEqual(['Entrar na área da equipe']);
    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'password');
    expect(screen.getByRole('status')).toHaveTextContent('Sua sessão terminou');
    expect(container.querySelector('[data-section="equipe-login"]')).not.toBeNull();
  });

  it('login com sessão válida → vai direto às consultas', async () => {
    expect(redirecionaPara(await erroDe(LoginPage(props())), '/eba/equipe/consultas')).toBe(true);
  });
});

describe('consultas', () => {
  it('lista os alunos com o nome da turma, paginação e o bearer em toda chamada (só no servidor)', async () => {
    const { container } = await renderizarServidor(await ConsultasPage(props()));
    expect(screen.getAllByRole('heading', { level: 1 }).map((h) => h.textContent)).toEqual(['Consultas']);
    expect(screen.getByRole('table', { name: 'Todos os alunos (45)' })).toBeInTheDocument();
    expect(screen.getByText('Membros ADAI')).toBeInTheDocument();
    expect(screen.getByText('Página 1 de 3')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Próxima página' })).toHaveAttribute('href', '/eba/equipe/consultas?pagina=2');
    for (const [url, init] of api.mock.calls as [string, RequestInit][]) {
      expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${BEARER}`);
      expect(url).not.toContain(BEARER);
    }
    expect(container.innerHTML).not.toContain(BEARER);
    expect(container.querySelector('[data-section="equipe-consultas"]')).not.toBeNull();
  });

  it('nenhum link da lista leva e-mail ou nome na URL', async () => {
    await renderizarServidor(await ConsultasPage(props()));
    for (const a of screen.getAllByRole('link', { name: /Ver resultado/ })) {
      expect(a.getAttribute('href')).toMatch(/^\/eba\/equipe\/consultas\/[0-9a-f-]{36}$/);
    }
  });

  it.each([['2', 'page=2'], ['abc', 'page=1'], ['0', 'page=1'], ['999999', 'page=1'], ['1.5', 'page=1']])('?pagina=%s pede %s à API', async (valor, esperado) => {
    await renderizarServidor(await ConsultasPage(props({ pagina: valor })));
    expect(api.mock.calls.some(([url]) => String(url).includes(`/Student?${esperado}&page-size=20`))).toBe(true);
  });

  it('API responde 401 → sessão encerrada: vai ao login com o aviso', async () => {
    api.mockImplementation(() => resposta(401, {}));
    expect(redirecionaPara(await erroDe(ConsultasPage(props())), '/eba/equipe/login?motivo=sessao')).toBe(true);
  });

  it('API fora → mensagem em role=alert, a busca continua na tela e nenhum dado pessoal no log', async () => {
    const aviso = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    api.mockImplementation(() => resposta(500, {}));
    await renderizarServidor(await ConsultasPage(props()));
    expect(screen.getByRole('alert')).toHaveTextContent('Não conseguimos carregar a lista de alunos agora');
    expect(screen.getByRole('search')).toBeInTheDocument();
    expect(JSON.stringify(aviso.mock.calls)).not.toContain(BEARER);
    aviso.mockRestore();
  });
});

describe('detalhe do aluno', () => {
  const chamar = (idStudent = ID) => DetalhePage({ params: Promise.resolve({ idStudent }) });

  it('cadastro e resultados dos testes feitos, buscados com o bearer (consulta existente da API)', async () => {
    await renderizarServidor(await chamar());
    expect(screen.getAllByRole('heading', { level: 1 }).map((h) => h.textContent)).toEqual(['Ana Exemplo']);
    expect(screen.getByText('ana@exemplo.com')).toBeInTheDocument();
    expect(screen.getByText('Membros ADAI')).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['Dons de serviço prático']);
    const chamadas = (api.mock.calls as [string, RequestInit][]).filter(([url]) => url.includes('/SurveyResult/'));
    expect(chamadas).toHaveLength(5);
    expect(chamadas.every(([url, init]) => !url.includes('/Hub/') && (init.headers as Record<string, string>).Authorization === `Bearer ${BEARER}`)).toBe(true);
  });

  it.each(['abc', '../Student', `${ID}/x`])('id que não é UUID (%p) → 404 sem chamar a API', async (id) => {
    expect(e404(await erroDe(chamar(id)))).toBe(true);
    expect(api).not.toHaveBeenCalled();
  });

  it('aluno inexistente na API → 404', async () => {
    api.mockImplementation((url: string) => (url.includes('/Student/') ? resposta(404, {}) : resposta(200, turmasPaginadas)));
    expect(e404(await erroDe(chamar()))).toBe(true);
  });

  it('401 → login; 500 → mensagem sem derrubar a página', async () => {
    api.mockImplementation(() => resposta(401, {}));
    expect(redirecionaPara(await erroDe(chamar()), '/eba/equipe/login?motivo=sessao')).toBe(true);
    const aviso = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    api.mockImplementation(() => resposta(500, {}));
    await renderizarServidor(await chamar());
    expect(screen.getByRole('alert')).toHaveTextContent('Não conseguimos carregar este aluno agora');
    aviso.mockRestore();
  });
});

describe('turmas', () => {
  it('lista as turmas (todas as páginas) com o formulário de nova turma', async () => {
    await renderizarServidor(await TurmasPage());
    expect(screen.getAllByRole('heading', { level: 1 }).map((h) => h.textContent)).toEqual(['Turmas']);
    expect(screen.getByRole('table', { name: `Turmas (${classes.data.length})` })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Nova turma' })).toBeInTheDocument();
    expect((api.mock.calls[0][1] as RequestInit).headers).toMatchObject({ Authorization: `Bearer ${BEARER}` });
  });

  it('401 → login; API fora → mensagem', async () => {
    api.mockImplementation(() => resposta(401, {}));
    expect(redirecionaPara(await erroDe(TurmasPage()), '/eba/equipe/login?motivo=sessao')).toBe(true);
    const aviso = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    api.mockImplementation(() => resposta(500, {}));
    await renderizarServidor(await TurmasPage());
    expect(screen.getByRole('alert')).toHaveTextContent('Não conseguimos carregar as turmas agora');
    aviso.mockRestore();
  });
});

describe('qr-codes', () => {
  it('com sessão: um h1, os 5 testes com imagem, endereço do QR e endereço do Hub, sem chamar a API', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://adai.com.br';
    const { container } = await renderizarServidor(await QrCodesPage());
    expect(screen.getAllByRole('heading', { level: 1 }).map((h) => h.textContent)).toEqual(['QR codes dos testes']);
    expect(screen.getAllByRole('img')).toHaveLength(5);
    expect(screen.getByText('https://adai.com.br/eba/testes/estilo-pessoal')).toBeInTheDocument();
    expect(screen.getByText('https://eba.adai.com.br/teste/estilo-pessoal')).toBeInTheDocument();
    expect(container.querySelector('[data-section="equipe-qr-codes"]')).not.toBeNull();
    expect(api).not.toHaveBeenCalled();
  });
});
