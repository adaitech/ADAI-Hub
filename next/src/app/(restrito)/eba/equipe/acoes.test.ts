/** @jest-environment node */
import {
  apagarTurmaAcao,
  buscarAlunosAcao,
  criarTurmaAcao,
  editarTurmaAcao,
  entrarNaEquipe,
  sairDaEquipe,
} from './acoes';
import { COOKIE_EQUIPE, abrirSessaoEquipe, OPCOES_COOKIE_EQUIPE } from '@/lib/eba/equipe/sessao';
import { ebaApiConfigurada, EbaApiError, EbaApiIndisponivel } from '@/lib/eba-api/client';
import * as equipe from '@/lib/eba-api/equipe';

const cookieGet = jest.fn();
const cookieSet = jest.fn();
const cookieDelete = jest.fn();
const headerGet = jest.fn();
jest.mock('next/headers', () => ({
  cookies: async () => ({ get: cookieGet, set: cookieSet, delete: cookieDelete }),
  headers: async () => ({ get: headerGet }),
}));
jest.mock('@/lib/eba-api/client', () => ({ ...jest.requireActual('@/lib/eba-api/client'), ebaApiConfigurada: jest.fn() }));
jest.mock('@/lib/eba-api/equipe', () => ({
  ...jest.requireActual('@/lib/eba-api/equipe'),
  entrar: jest.fn(),
  buscarAlunos: jest.fn(),
  listarTurmas: jest.fn(),
  listarAlunos: jest.fn(),
  criarTurma: jest.fn(),
  editarTurma: jest.fn(),
  apagarTurma: jest.fn(),
}));

const SEGREDO = 'segredo-da-equipe-com-mais-de-32-caracteres!';
const BEARER = 'bearer-da-equipe';
const TURMA = '63904477-46a9-474d-0432-08df2d7fd584';
const DADOS = { nome: 'Turma Nova', status: 1, inicio: '2026-11-01', fim: '2027-03-01' };
const ORIGINAL = { ...process.env };
let ipSeq = 0;
let warn: jest.SpyInstance;

const m = jest.mocked(equipe);
const comSessao = (valida = true) => {
  const { valor } = abrirSessaoEquipe({ accessToken: BEARER, email: 'ana@adai.com.br', expiresIn: 3600 }, SEGREDO, Date.now());
  cookieGet.mockImplementation((nome: string) => (valida && nome === COOKIE_EQUIPE ? { value: valor } : undefined));
};

beforeEach(() => {
  jest.clearAllMocks();
  process.env.EBA_EQUIPE_SEGREDO = SEGREDO;
  jest.mocked(ebaApiConfigurada).mockReturnValue(true);
  ipSeq += 1;
  headerGet.mockReturnValue(`203.0.113.${ipSeq}`);
  comSessao();
  m.listarTurmas.mockResolvedValue([{ id: TURMA, nome: 'Membros ADAI', status: 2, inicio: '2026-01-01', fim: '2032-01-01' }]);
  warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});
afterEach(() => warn.mockRestore());
afterAll(() => {
  process.env = ORIGINAL;
});

describe('entrarNaEquipe', () => {
  beforeEach(() => {
    cookieGet.mockReturnValue(undefined);
    m.entrar.mockResolvedValue({ accessToken: BEARER, expiresIn: 3600 });
  });

  it('credenciais certas: grava o cookie httpOnly cifrado (sem o bearer em claro) e devolve ok sem o token', async () => {
    const r = await entrarNaEquipe(' Ana@Adai.com.br ', 'Senha@123');
    expect(r).toEqual({ ok: true });
    expect(m.entrar).toHaveBeenCalledWith('ana@adai.com.br', 'Senha@123');
    const [nome, valor, opcoes] = cookieSet.mock.calls[0];
    expect(nome).toBe(COOKIE_EQUIPE);
    expect(valor).not.toContain(BEARER);
    expect(opcoes).toEqual(OPCOES_COOKIE_EQUIPE);
    expect(JSON.stringify(r)).not.toContain(BEARER);
  });

  it('credenciais erradas: mesma resposta para qualquer motivo, sem cookie', async () => {
    m.entrar.mockRejectedValue(new equipe.CredenciaisInvalidas());
    expect(await entrarNaEquipe('ana@adai.com.br', 'errada')).toEqual({ ok: false, erro: 'credenciais' });
    expect(cookieSet).not.toHaveBeenCalled();
  });

  it.each([new EbaApiError(500, null), new EbaApiIndisponivel('timeout')])('API fora (%s) → indisponivel, sem credencial no log', async (erro) => {
    m.entrar.mockRejectedValue(erro);
    expect(await entrarNaEquipe('ana@adai.com.br', 'Senha@123')).toEqual({ ok: false, erro: 'indisponivel' });
    const log = JSON.stringify(warn.mock.calls);
    expect(log).not.toContain('Senha@123');
    expect(log).not.toContain('ana@adai');
  });

  it.each([['', 'x'], ['sem-arroba', 'x'], ['ana@adai.com.br', ''], ['ana@adai.com.br', 'x'.repeat(201)], ['a'.repeat(250) + '@b.com', 'x']])('entrada inválida (%p) → invalido, sem chamar a API', async (email, senha) => {
    expect(await entrarNaEquipe(email, senha)).toEqual({ ok: false, erro: 'invalido' });
    expect(m.entrar).not.toHaveBeenCalled();
  });

  it('segredo ausente ou API não configurada → indisponivel (falha fechado)', async () => {
    delete process.env.EBA_EQUIPE_SEGREDO;
    expect(await entrarNaEquipe('ana@adai.com.br', 'Senha@123')).toEqual({ ok: false, erro: 'indisponivel' });
    process.env.EBA_EQUIPE_SEGREDO = SEGREDO;
    jest.mocked(ebaApiConfigurada).mockReturnValue(false);
    expect(await entrarNaEquipe('ana@adai.com.br', 'Senha@123')).toEqual({ ok: false, erro: 'indisponivel' });
    expect(m.entrar).not.toHaveBeenCalled();
  });

  it('limite contra força bruta: a 6ª tentativa no minuto, do mesmo IP, → limite (mesmo com a senha certa)', async () => {
    headerGet.mockReturnValue('198.51.100.20');
    m.entrar.mockRejectedValue(new equipe.CredenciaisInvalidas());
    for (let i = 0; i < 5; i += 1) await entrarNaEquipe('ana@adai.com.br', `errada${i}`);
    m.entrar.mockClear();
    m.entrar.mockResolvedValue({ accessToken: BEARER, expiresIn: 3600 });
    expect(await entrarNaEquipe('ana@adai.com.br', 'Senha@123')).toEqual({ ok: false, erro: 'limite' });
    expect(m.entrar).not.toHaveBeenCalled();
  });

  it('expiresIn inválido vindo da API → indisponivel, sem cookie', async () => {
    m.entrar.mockResolvedValue({ accessToken: BEARER, expiresIn: 5 });
    expect(await entrarNaEquipe('ana@adai.com.br', 'Senha@123')).toEqual({ ok: false, erro: 'indisponivel' });
    expect(cookieSet).not.toHaveBeenCalled();
  });
});

describe('sairDaEquipe', () => {
  it('apaga o cookie no mesmo caminho', async () => {
    await sairDaEquipe();
    expect(cookieDelete).toHaveBeenCalledWith({ name: COOKIE_EQUIPE, path: '/eba/equipe' });
  });
});

describe.each([
  ['buscarAlunosAcao', () => buscarAlunosAcao('ana')],
  ['criarTurmaAcao', () => criarTurmaAcao(DADOS)],
  ['editarTurmaAcao', () => editarTurmaAcao({ ...DADOS, id: TURMA })],
  ['apagarTurmaAcao', () => apagarTurmaAcao(TURMA)],
])('%s: guarda de sessão', (_nome, chamar) => {
  it('sem cookie, vencido ou adulterado → sessao, sem nenhuma chamada à API', async () => {
    comSessao(false);
    expect(await chamar()).toEqual({ ok: false, erro: 'sessao' });
    cookieGet.mockReturnValue({ value: 'v1.lixo' });
    expect(await chamar()).toEqual({ ok: false, erro: 'sessao' });
    for (const fn of [m.buscarAlunos, m.criarTurma, m.editarTurma, m.apagarTurma, m.listarAlunos]) expect(fn).not.toHaveBeenCalled();
  });

  it('API responde 401 (token recusado) → sessao', async () => {
    m.buscarAlunos.mockRejectedValue(new equipe.SessaoEncerrada());
    m.criarTurma.mockRejectedValue(new equipe.SessaoEncerrada());
    m.editarTurma.mockRejectedValue(new equipe.SessaoEncerrada());
    m.apagarTurma.mockRejectedValue(new equipe.SessaoEncerrada());
    m.listarAlunos.mockResolvedValue({ alunos: [], pagina: 1, totalPaginas: 1, total: 0 });
    expect(await chamar()).toEqual({ ok: false, erro: 'sessao' });
  });
});

describe('buscarAlunosAcao', () => {
  it('usa o bearer da sessão e junta o nome da turma (sem chamada por aluno)', async () => {
    m.buscarAlunos.mockResolvedValue([{ id: 'a', nome: 'Ana', email: 'ana@exemplo.com', unidade: 'campestre', idTurma: TURMA, criadoEm: '' }]);
    const r = await buscarAlunosAcao('ana');
    expect(m.buscarAlunos).toHaveBeenCalledWith(BEARER, 'ana');
    expect(m.listarTurmas).toHaveBeenCalledTimes(1);
    expect(r).toEqual({ ok: true, dados: [{ id: 'a', nome: 'Ana', email: 'ana@exemplo.com', unidade: 'campestre', turma: 'Membros ADAI' }] });
  });

  it('turma desconhecida → "Desconhecida"; consulta vazia → invalido; API fora → indisponivel sem dado no log', async () => {
    m.buscarAlunos.mockResolvedValue([{ id: 'a', nome: 'Ana', email: 'ana@exemplo.com', unidade: '', idTurma: 'outra', criadoEm: '' }]);
    expect(((await buscarAlunosAcao('ana')) as { dados: { turma: string }[] }).dados[0].turma).toBe('Desconhecida');
    expect(await buscarAlunosAcao('   ')).toEqual({ ok: false, erro: 'invalido' });
    m.buscarAlunos.mockRejectedValue(new EbaApiIndisponivel('rede'));
    expect(await buscarAlunosAcao('ana@exemplo.com')).toEqual({ ok: false, erro: 'indisponivel' });
    expect(JSON.stringify(warn.mock.calls)).not.toContain('ana@exemplo');
  });
});

describe('turmas', () => {
  beforeEach(() => {
    m.criarTurma.mockResolvedValue(undefined);
    m.editarTurma.mockResolvedValue(undefined);
    m.apagarTurma.mockResolvedValue(undefined);
    m.listarAlunos.mockResolvedValue({ alunos: [], pagina: 1, totalPaginas: 0, total: 0 });
  });

  it('criar e editar chamam a API com o bearer da sessão', async () => {
    expect(await criarTurmaAcao(DADOS)).toEqual({ ok: true });
    expect(m.criarTurma).toHaveBeenCalledWith(BEARER, DADOS);
    expect(await editarTurmaAcao({ ...DADOS, id: TURMA })).toEqual({ ok: true });
    expect(m.editarTurma).toHaveBeenCalledWith(BEARER, { ...DADOS, id: TURMA });
  });

  it('dados inválidos → invalido, sem chamar a API', async () => {
    expect(await criarTurmaAcao({ ...DADOS, nome: 'ab' })).toEqual({ ok: false, erro: 'invalido' });
    expect(await editarTurmaAcao({ ...DADOS, id: 'x' })).toEqual({ ok: false, erro: 'invalido' });
    expect(m.criarTurma).not.toHaveBeenCalled();
    expect(m.editarTurma).not.toHaveBeenCalled();
  });

  it('400 da API → recusado; falha de rede → indisponivel', async () => {
    m.criarTurma.mockRejectedValueOnce(new EbaApiError(400, null)).mockRejectedValueOnce(new EbaApiIndisponivel('rede'));
    expect(await criarTurmaAcao(DADOS)).toEqual({ ok: false, erro: 'recusado' });
    expect(await criarTurmaAcao(DADOS)).toEqual({ ok: false, erro: 'indisponivel' });
  });

  it('apagar turma sem alunos: apaga', async () => {
    expect(await apagarTurmaAcao(TURMA)).toEqual({ ok: true });
    expect(m.listarAlunos).toHaveBeenCalledWith(BEARER, { pagina: 1, tamanho: 1, idTurma: TURMA });
    expect(m.apagarTurma).toHaveBeenCalledWith(BEARER, TURMA);
  });

  it('apagar turma COM alunos: recusa (turma-com-alunos) e não apaga', async () => {
    m.listarAlunos.mockResolvedValue({ alunos: [], pagina: 1, totalPaginas: 3, total: 21 });
    expect(await apagarTurmaAcao(TURMA)).toEqual({ ok: false, erro: 'turma-com-alunos' });
    expect(m.apagarTurma).not.toHaveBeenCalled();
  });

  it('não conseguir contar os alunos → indisponivel e não apaga (falha fechado)', async () => {
    m.listarAlunos.mockRejectedValue(new EbaApiIndisponivel('rede'));
    expect(await apagarTurmaAcao(TURMA)).toEqual({ ok: false, erro: 'indisponivel' });
    expect(m.apagarTurma).not.toHaveBeenCalled();
  });

  it('id inválido ao apagar → invalido', async () => {
    expect(await apagarTurmaAcao('../x')).toEqual({ ok: false, erro: 'invalido' });
    expect(m.listarAlunos).not.toHaveBeenCalled();
  });

  it('limite de escritas: depois de 20 por minuto no mesmo IP → limite', async () => {
    headerGet.mockReturnValue('198.51.100.30');
    for (let i = 0; i < 20; i += 1) await criarTurmaAcao(DADOS);
    expect(await criarTurmaAcao(DADOS)).toEqual({ ok: false, erro: 'limite' });
  });
});
