/** @jest-environment node */
import { abrirSessaoEquipe, COOKIE_EQUIPE } from './sessao';
import { exigirSessaoDaEquipe, sessaoDaEquipe } from './servidor';

const cookieGet = jest.fn();
jest.mock('next/headers', () => ({ cookies: async () => ({ get: cookieGet }) }));
const redirecionar = jest.fn((destino: string) => {
  throw new Error(`REDIRECT:${destino}`);
});
const naoEncontrado = jest.fn(() => {
  throw new Error('NOT_FOUND');
});
jest.mock('next/navigation', () => ({ redirect: (d: string) => redirecionar(d), notFound: () => naoEncontrado() }));

const SEGREDO = 'segredo-da-equipe-com-mais-de-32-caracteres!';
const ORIGINAL = process.env.EBA_EQUIPE_SEGREDO;
const cookie = (expiresIn = 3600) => abrirSessaoEquipe({ accessToken: 'bearer', email: 'ana@adai.com.br', expiresIn }, SEGREDO, Date.now()).valor;

beforeEach(() => {
  jest.clearAllMocks();
  process.env.EBA_EQUIPE_SEGREDO = SEGREDO;
  cookieGet.mockImplementation((nome: string) => (nome === COOKIE_EQUIPE ? { value: cookie() } : undefined));
});
afterAll(() => {
  if (ORIGINAL === undefined) delete process.env.EBA_EQUIPE_SEGREDO;
  else process.env.EBA_EQUIPE_SEGREDO = ORIGINAL;
});

describe('sessaoDaEquipe', () => {
  it('sessão válida → bearer e e-mail', async () => {
    expect(await sessaoDaEquipe()).toEqual({ accessToken: 'bearer', email: 'ana@adai.com.br' });
  });

  it('sem cookie, adulterado ou área desligada → null', async () => {
    cookieGet.mockReturnValue(undefined);
    expect(await sessaoDaEquipe()).toBeNull();
    cookieGet.mockReturnValue({ value: 'v1.lixo' });
    expect(await sessaoDaEquipe()).toBeNull();
    delete process.env.EBA_EQUIPE_SEGREDO;
    expect(await sessaoDaEquipe()).toBeNull();
  });
});

describe('exigirSessaoDaEquipe', () => {
  it('com sessão devolve os dados', async () => {
    expect((await exigirSessaoDaEquipe()).accessToken).toBe('bearer');
  });

  it('sem sessão → redireciona para o login', async () => {
    cookieGet.mockReturnValue(undefined);
    await expect(exigirSessaoDaEquipe()).rejects.toThrow('REDIRECT:/eba/equipe/login');
  });

  it('área desligada (sem o segredo) → 404, nunca redireciona', async () => {
    delete process.env.EBA_EQUIPE_SEGREDO;
    await expect(exigirSessaoDaEquipe()).rejects.toThrow('NOT_FOUND');
    expect(redirecionar).not.toHaveBeenCalled();
  });
});
