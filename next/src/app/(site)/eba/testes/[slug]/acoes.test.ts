/** @jest-environment node */
import { cadastrar, enviar, identificar, sair, sessaoAtual } from './acoes';
import { assinarSessao, COOKIE_SESSAO, OPCOES_COOKIE } from '@/lib/eba/sessao';
import { alunoPorEmail, cadastrarAluno } from '@/lib/eba-api/alunos';
import { EbaApiError, EbaApiIndisponivel, EbaApiRespostaInvalida, ebaApiConfigurada } from '@/lib/eba-api/client';
import { perguntasDoTeste } from '@/lib/eba-api/perguntas';
import { enviarRespostas, type Resultado } from '@/lib/eba-api/respostas';
import { turmasAtivas } from '@/lib/eba-api/turmas';

const cookieGet = jest.fn();
const cookieSet = jest.fn();
const cookieDelete = jest.fn();
const headerGet = jest.fn();
jest.mock('next/headers', () => ({
  cookies: async () => ({ get: cookieGet, set: cookieSet, delete: cookieDelete }),
  headers: async () => ({ get: headerGet }),
}));
jest.mock('@/lib/eba-api/alunos', () => ({
  ...jest.requireActual('@/lib/eba-api/alunos'),
  alunoPorEmail: jest.fn(),
  cadastrarAluno: jest.fn(),
}));
jest.mock('@/lib/eba-api/client', () => ({
  ...jest.requireActual('@/lib/eba-api/client'),
  ebaApiConfigurada: jest.fn(),
}));
jest.mock('@/lib/eba-api/perguntas', () => ({ perguntasDoTeste: jest.fn() }));
jest.mock('@/lib/eba-api/respostas', () => ({ enviarRespostas: jest.fn() }));
jest.mock('@/lib/eba-api/turmas', () => ({ turmasAtivas: jest.fn() }));

const SEGREDO = 'segredo-de-teste-com-mais-de-32-caracteres';
const EMAIL = 'ana.silva@exemplo.com';
/** E-mail mascarado da sessão de `sessaoValida()`: dono das respostas enviadas. */
const COMO = 'a***@exemplo.com';
const TURMAS = [{ id: 'turma-1', nome: 'Turma 1' }];
const resultado: Resultado = { tipo: 'pontuacao', itens: [], maximo: 25 };

const alunoPorEmailMock = jest.mocked(alunoPorEmail);
const cadastrarAlunoMock = jest.mocked(cadastrarAluno);
const turmasMock = jest.mocked(turmasAtivas);
const perguntasMock = jest.mocked(perguntasDoTeste);
const enviarMock = jest.mocked(enviarRespostas);
const configuradaMock = jest.mocked(ebaApiConfigurada);

let ipSeq = 0;
function sessaoValida(emitidoEm = Date.now()) {
  return assinarSessao(
    { idStudent: 'aluno-1', idClass: 'turma-1', emailMascarado: 'a***@exemplo.com', emitidoEm },
    SEGREDO,
  );
}
function comSessao(valor: string | undefined) {
  cookieGet.mockImplementation((nome: string) => (nome === COOKIE_SESSAO && valor ? { value: valor } : undefined));
}
const perguntas = (n: number) => Array.from({ length: n }, (_, i) => ({ numero: i + 1, texto: `p${i + 1}` }));
const notas = (n: number, nota: number) => Array.from({ length: n }, (_, i) => ({ numero: i + 1, nota }));

let warn: jest.SpyInstance;
let log: jest.SpyInstance;
let error: jest.SpyInstance;

beforeEach(() => {
  jest.resetAllMocks();
  process.env.EBA_SESSAO_SEGREDO = SEGREDO;
  configuradaMock.mockReturnValue(true);
  // IP distinto por teste: o limitador é do módulo e não deve vazar entre testes
  headerGet.mockImplementation(() => `10.0.0.${++ipSeq}, 1.1.1.1`);
  comSessao(undefined);
  turmasMock.mockResolvedValue(TURMAS);
  warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => {
  jest.restoreAllMocks();
});

describe('identificar', () => {
  it('e-mail existente: grava o cookie assinado e devolve só o e-mail mascarado', async () => {
    alunoPorEmailMock.mockResolvedValue({ idStudent: 'aluno-1', idClass: 'turma-1' });
    const r = await identificar(`  ${EMAIL.toUpperCase()} `);
    expect(r).toEqual({ ok: true, dados: { emailMascarado: 'a***@exemplo.com' } });
    expect(JSON.stringify(r)).not.toMatch(/aluno-1|turma-1/);
    expect(cookieSet).toHaveBeenCalledTimes(1);
    const [nome, valor, opcoes] = cookieSet.mock.calls[0];
    expect(nome).toBe(COOKIE_SESSAO);
    expect(opcoes).toEqual(OPCOES_COOKIE);
    expect(valor).toMatch(/^[\w-]+\.[\w-]+$/);
  });

  it('e-mail novo: devolve as turmas e não grava cookie', async () => {
    alunoPorEmailMock.mockResolvedValue(null);
    const r = await identificar(EMAIL);
    expect(r).toEqual({ ok: true, dados: { novo: true, turmas: TURMAS } });
    expect(cookieSet).not.toHaveBeenCalled();
  });

  it('e-mail novo com turmasAtivas() falhando → indisponivel', async () => {
    alunoPorEmailMock.mockResolvedValue(null);
    turmasMock.mockRejectedValue(new EbaApiIndisponivel('rede'));
    expect(await identificar(EMAIL)).toEqual({ ok: false, erro: 'indisponivel' });
    expect(cookieSet).not.toHaveBeenCalled();
  });

  it('e-mail inválido ou com mais de 254 caracteres → invalido, sem chamar a API', async () => {
    expect(await identificar('nao-e-email')).toEqual({ ok: false, erro: 'invalido' });
    expect(await identificar(`${'a'.repeat(250)}@x.com`)).toEqual({ ok: false, erro: 'invalido' });
    expect(await identificar(undefined as unknown as string)).toEqual({ ok: false, erro: 'invalido' });
    expect(alunoPorEmailMock).not.toHaveBeenCalled();
  });

  it('a 11ª chamada no minuto, do mesmo IP, devolve limite antes de validar ou chamar a API', async () => {
    headerGet.mockReturnValue('9.9.9.9, 8.8.8.8');
    alunoPorEmailMock.mockResolvedValue(null);
    for (let i = 0; i < 10; i++) expect((await identificar(EMAIL)).ok).toBe(true);
    alunoPorEmailMock.mockClear();
    expect(await identificar(EMAIL)).toEqual({ ok: false, erro: 'limite' });
    expect(await identificar('lixo')).toEqual({ ok: false, erro: 'limite' });
    expect(alunoPorEmailMock).not.toHaveBeenCalled();
  });

  it('sem x-forwarded-for usa a chave local', async () => {
    headerGet.mockReturnValue(null);
    alunoPorEmailMock.mockResolvedValue(null);
    expect((await identificar(EMAIL)).ok).toBe(true);
  });

  it('falha da API → indisponivel', async () => {
    alunoPorEmailMock.mockRejectedValue(new EbaApiError(503, null));
    expect(await identificar(EMAIL)).toEqual({ ok: false, erro: 'indisponivel' });
  });

  it('Student com formato inválido → indisponivel, sem cookie', async () => {
    alunoPorEmailMock.mockRejectedValue(new EbaApiRespostaInvalida('Student (GET) sem id/idClass'));
    expect(await identificar(EMAIL)).toEqual({ ok: false, erro: 'indisponivel' });
    expect(cookieSet).not.toHaveBeenCalled();
  });

  it.each([undefined, '', 'curto'])('segredo ausente ou curto (%p) → indisponivel, sem cookie', async (segredo) => {
    if (segredo === undefined) delete process.env.EBA_SESSAO_SEGREDO;
    else process.env.EBA_SESSAO_SEGREDO = segredo;
    alunoPorEmailMock.mockResolvedValue({ idStudent: 'aluno-1', idClass: 'turma-1' });
    expect(await identificar(EMAIL)).toEqual({ ok: false, erro: 'indisponivel' });
    expect(cookieSet).not.toHaveBeenCalled();
  });

  it('API não configurada → indisponivel sem chamar a API', async () => {
    configuradaMock.mockReturnValue(false);
    expect(await identificar(EMAIL)).toEqual({ ok: false, erro: 'indisponivel' });
    expect(alunoPorEmailMock).not.toHaveBeenCalled();
  });
});

describe('cadastrar', () => {
  const dados = { email: EMAIL, nome: '  Ana Silva ', unidade: 'colorado', idTurma: 'turma-1' };
  beforeEach(() => alunoPorEmailMock.mockResolvedValue(null));

  it('confere o e-mail (normalizado) antes do POST', async () => {
    cadastrarAlunoMock.mockResolvedValue({ idStudent: 'aluno-9', idClass: 'turma-1' });
    await cadastrar({ ...dados, email: ` ${EMAIL.toUpperCase()} ` });
    expect(alunoPorEmailMock).toHaveBeenCalledWith(EMAIL);
    expect(alunoPorEmailMock.mock.invocationCallOrder[0]).toBeLessThan(cadastrarAlunoMock.mock.invocationCallOrder[0]);
  });

  it('e-mail que já existe: abre a sessão do aluno encontrado e não faz o POST', async () => {
    alunoPorEmailMock.mockResolvedValue({ idStudent: 'aluno-1', idClass: 'turma-1' });
    const r = await cadastrar(dados);
    expect(r).toEqual({ ok: true, dados: { emailMascarado: 'a***@exemplo.com' } });
    expect(cadastrarAlunoMock).not.toHaveBeenCalled();
    expect(cookieSet).toHaveBeenCalledWith(COOKIE_SESSAO, expect.any(String), OPCOES_COOKIE);
  });

  it('conferência do e-mail falhando → indisponivel, sem POST', async () => {
    alunoPorEmailMock.mockRejectedValue(new EbaApiIndisponivel('rede'));
    expect(await cadastrar(dados)).toEqual({ ok: false, erro: 'indisponivel' });
    expect(cadastrarAlunoMock).not.toHaveBeenCalled();
  });

  it('cadastrarAluno com 400 → recusado', async () => {
    cadastrarAlunoMock.mockRejectedValue(new EbaApiError(400, 'X'));
    expect(await cadastrar(dados)).toEqual({ ok: false, erro: 'recusado' });
    expect(cookieSet).not.toHaveBeenCalled();
  });

  it('Student do POST com formato inválido → indisponivel, sem cookie', async () => {
    cadastrarAlunoMock.mockRejectedValue(new EbaApiRespostaInvalida('Student (POST) sem id/idClass'));
    expect(await cadastrar(dados)).toEqual({ ok: false, erro: 'indisponivel' });
    expect(cookieSet).not.toHaveBeenCalled();
  });

  it('cadastra, grava o cookie e devolve só o e-mail mascarado', async () => {
    cadastrarAlunoMock.mockResolvedValue({ idStudent: 'aluno-9', idClass: 'turma-1' });
    const r = await cadastrar(dados);
    expect(r).toEqual({ ok: true, dados: { emailMascarado: 'a***@exemplo.com' } });
    expect(cadastrarAlunoMock).toHaveBeenCalledWith({
      nome: 'Ana Silva',
      email: EMAIL,
      unidade: 'colorado',
      idTurma: 'turma-1',
    });
    expect(cookieSet).toHaveBeenCalledWith(COOKIE_SESSAO, expect.any(String), OPCOES_COOKIE);
  });

  it.each([
    ['e-mail inválido', { email: 'x' }],
    ['e-mail com mais de 254', { email: `${'a'.repeat(250)}@x.com` }],
    ['nome curto', { nome: ' ab ' }],
    ['nome longo', { nome: 'a'.repeat(101) }],
    ['nome com quebra de linha', { nome: 'Ana\nSilva' }],
    ['nome com tabulação', { nome: 'Ana\tSilva' }],
    ['nome com caractere nulo', { nome: 'Ana\u0000Silva' }],
    ['nome com DEL', { nome: 'Ana\u007fSilva' }],
    ['unidade fora da lista', { unidade: 'marte' }],
    ['turma fora de turmasAtivas()', { idTurma: 'outra' }],
  ])('%s → invalido', async (_n, alteracao) => {
    expect(await cadastrar({ ...dados, ...alteracao })).toEqual({ ok: false, erro: 'invalido' });
    expect(cadastrarAlunoMock).not.toHaveBeenCalled();
    expect(cookieSet).not.toHaveBeenCalled();
  });

  it('turmasAtivas() falhando → indisponivel', async () => {
    turmasMock.mockRejectedValue(new EbaApiIndisponivel('rede'));
    expect(await cadastrar(dados)).toEqual({ ok: false, erro: 'indisponivel' });
  });

  it('cadastrarAluno falhando → indisponivel', async () => {
    cadastrarAlunoMock.mockRejectedValue(new EbaApiError(500, null));
    expect(await cadastrar(dados)).toEqual({ ok: false, erro: 'indisponivel' });
  });

  it('aplica o mesmo limite por IP', async () => {
    headerGet.mockReturnValue('7.7.7.7');
    cadastrarAlunoMock.mockResolvedValue({ idStudent: 'a', idClass: 'b' });
    for (let i = 0; i < 10; i++) expect((await cadastrar(dados)).ok).toBe(true);
    expect(await cadastrar(dados)).toEqual({ ok: false, erro: 'limite' });
  });

  it('segredo curto → indisponivel', async () => {
    process.env.EBA_SESSAO_SEGREDO = 'curto';
    expect(await cadastrar(dados)).toEqual({ ok: false, erro: 'indisponivel' });
  });
});

describe('enviar', () => {
  beforeEach(() => {
    comSessao(sessaoValida());
    perguntasMock.mockResolvedValue(perguntas(3));
    enviarMock.mockResolvedValue(resultado);
  });

  it('usa idStudent/idClass da sessão e devolve o resultado', async () => {
    const r = await enviar('dons-servico', notas(3, 4), COMO);
    expect(r).toEqual({ ok: true, dados: resultado });
    expect(enviarMock).toHaveBeenCalledWith({
      slug: 'dons-servico',
      idStudent: 'aluno-1',
      idClass: 'turma-1',
      respostas: notas(3, 4),
    });
  });

  it('ignora ids que o cliente tente mandar dentro das respostas', async () => {
    const maliciosas = notas(3, 1).map((r) => ({ ...r, idStudent: 'outro', idClass: 'outra' }));
    await enviar('dons-servico', maliciosas, COMO);
    expect(enviarMock).toHaveBeenCalledWith(
      expect.objectContaining({ idStudent: 'aluno-1', idClass: 'turma-1', respostas: notas(3, 1) }),
    );
  });

  it.each([
    ['sem cookie', undefined],
    ['cookie adulterado', 'a.b'],
    ['sessão expirada', sessaoValida(Date.now() - 7_200_001)],
  ])('%s → sessao, sem chamar a API', async (_n, valor) => {
    comSessao(valor);
    expect(await enviar('dons-servico', notas(3, 1), COMO)).toEqual({ ok: false, erro: 'sessao' });
    expect(enviarMock).not.toHaveBeenCalled();
    expect(perguntasMock).not.toHaveBeenCalled();
  });

  it.each([
    ['cookie adulterado', 'a.b'],
    ['sessão expirada', sessaoValida(Date.now() - 7_200_001)],
  ])('%s: apaga o cookie no mesmo path', async (_n, valor) => {
    comSessao(valor);
    await enviar('dons-servico', notas(3, 1), COMO);
    expect(cookieDelete).toHaveBeenCalledWith({ name: COOKIE_SESSAO, path: OPCOES_COOKIE.path });
  });

  it('sem cookie: nada a apagar', async () => {
    comSessao(undefined);
    await enviar('dons-servico', notas(3, 1), COMO);
    expect(cookieDelete).not.toHaveBeenCalled();
  });

  it('sessão válida: não apaga o cookie', async () => {
    await enviar('dons-servico', notas(3, 1), COMO);
    expect(cookieDelete).not.toHaveBeenCalled();
  });

  it('respostas de outra pessoa (sessão trocada em outra aba) → sessao, sem chamar a API', async () => {
    // Aba 1 respondeu como A; na aba 2 entrou B e o cookie agora é de B.
    const r = await enviar('dons-servico', notas(3, 1), 'b***@exemplo.com');
    expect(r).toEqual({ ok: false, erro: 'sessao' });
    expect(enviarMock).not.toHaveBeenCalled();
    expect(perguntasMock).not.toHaveBeenCalled();
    // O cookie é válido (é de B, da outra aba): não é apagado.
    expect(cookieDelete).not.toHaveBeenCalled();
  });

  it('o dono das respostas é comparado com a sessão sem normalizar (máscara exata)', async () => {
    expect(await enviar('dons-servico', notas(3, 1), 'A***@exemplo.com')).toEqual({ ok: false, erro: 'sessao' });
    expect(await enviar('dons-servico', notas(3, 1), ` ${COMO}`)).toEqual({ ok: false, erro: 'sessao' });
    expect(enviarMock).not.toHaveBeenCalled();
  });

  it.each([
    ['vazio', ''],
    ['só espaços', '   '],
    ['mais de 260 caracteres', `${'a'.repeat(250)}@exemplo.com`],
    ['número', 3],
    ['ausente', undefined],
  ])('respondidoComo %s → invalido, sem chamar a API', async (_n, valor) => {
    expect(await enviar('dons-servico', notas(3, 1), valor as unknown as string)).toEqual({ ok: false, erro: 'invalido' });
    expect(enviarMock).not.toHaveBeenCalled();
  });

  it('segredo ausente → indisponivel', async () => {
    delete process.env.EBA_SESSAO_SEGREDO;
    expect(await enviar('dons-servico', notas(3, 1), COMO)).toEqual({ ok: false, erro: 'indisponivel' });
  });

  it('slug desconhecido → invalido', async () => {
    expect(await enviar('nao-existe', notas(3, 1), COMO)).toEqual({ ok: false, erro: 'invalido' });
    expect(enviarMock).not.toHaveBeenCalled();
  });

  describe('tipo nota', () => {
    it.each([
      ['incompletas', notas(2, 3)],
      ['a mais', notas(4, 3)],
      ['nota 6', [...notas(2, 3), { numero: 3, nota: 6 }]],
      ['nota negativa', [...notas(2, 3), { numero: 3, nota: -1 }]],
      ['nota fracionária', [...notas(2, 3), { numero: 3, nota: 2.5 }]],
      ['número repetido', [...notas(2, 3), { numero: 2, nota: 3 }]],
      ['número desconhecido', [...notas(2, 3), { numero: 9, nota: 3 }]],
      ['não é array', 'x' as unknown as []],
      ['item malformado', [...notas(2, 3), null as unknown as { numero: number; nota: number }]],
    ])('%s → invalido', async (_n, respostas) => {
      expect(await enviar('dons-ministerio', respostas, COMO)).toEqual({ ok: false, erro: 'invalido' });
      expect(enviarMock).not.toHaveBeenCalled();
    });

    it('aceita 0 e 5 e respostas fora de ordem', async () => {
      const r = await enviar('dons-servico', [
        { numero: 3, nota: 5 },
        { numero: 1, nota: 0 },
        { numero: 2, nota: 2 },
      ], COMO);
      expect(r.ok).toBe(true);
    });

    it('55 itens nos dons de serviço', async () => {
      perguntasMock.mockResolvedValue(perguntas(55));
      expect((await enviar('dons-servico', notas(55, 3), COMO)).ok).toBe(true);
      expect(await enviar('dons-servico', notas(54, 3), COMO)).toEqual({ ok: false, erro: 'invalido' });
    });

    it('perguntasDoTeste falhando → indisponivel', async () => {
      perguntasMock.mockRejectedValue(new EbaApiIndisponivel('rede'));
      expect(await enviar('dons-servico', notas(3, 1), COMO)).toEqual({ ok: false, erro: 'indisponivel' });
    });
  });

  describe('tipo talentos', () => {
    const marcar = (marcados: number[], total = 5) =>
      Array.from({ length: total }, (_, i) => ({ numero: i + 1, nota: marcados.includes(i + 1) ? 1 : 0 }));
    beforeEach(() => perguntasMock.mockResolvedValue(perguntas(5)));

    it('aceita de 1 a 3 marcados', async () => {
      expect((await enviar('talentos-naturais', marcar([1]), COMO)).ok).toBe(true);
      expect((await enviar('talentos-naturais', marcar([1, 2, 3]), COMO)).ok).toBe(true);
    });
    it.each([
      ['nenhum marcado', marcar([])],
      ['4 marcados', marcar([1, 2, 3, 4])],
      ['nota 2', [...marcar([1]).slice(0, 4), { numero: 5, nota: 2 }]],
      ['incompleto', marcar([1]).slice(0, 4)],
      ['repetido', [...marcar([1]).slice(0, 4), { numero: 4, nota: 0 }]],
    ])('%s → invalido', async (_n, respostas) => {
      expect(await enviar('talentos-naturais', respostas, COMO)).toEqual({ ok: false, erro: 'invalido' });
    });
  });

  describe('tipo estilo', () => {
    it('aceita numeros 1 e 2 com nota 7–35', async () => {
      expect((await enviar('estilo-pessoal', [{ numero: 1, nota: 7 }, { numero: 2, nota: 35 }], COMO)).ok).toBe(true);
      expect(perguntasMock).not.toHaveBeenCalled();
    });
    it.each([
      ['nota 6', [{ numero: 1, nota: 6 }, { numero: 2, nota: 20 }]],
      ['nota 36', [{ numero: 1, nota: 36 }, { numero: 2, nota: 20 }]],
      ['só um', [{ numero: 1, nota: 20 }]],
      ['três', [{ numero: 1, nota: 20 }, { numero: 2, nota: 20 }, { numero: 3, nota: 20 }]],
      ['número 3', [{ numero: 1, nota: 20 }, { numero: 3, nota: 20 }]],
      ['repetido', [{ numero: 1, nota: 20 }, { numero: 1, nota: 20 }]],
    ])('%s → invalido', async (_n, respostas) => {
      expect(await enviar('estilo-pessoal', respostas, COMO)).toEqual({ ok: false, erro: 'invalido' });
    });
  });

  describe('tipo temperamento', () => {
    const quatro = (nota: number) => notas(4, nota);
    it('aceita 4 grupos com nota 0–50', async () => {
      expect((await enviar('temperamento-pessoal', quatro(0), COMO)).ok).toBe(true);
      expect((await enviar('temperamento-pessoal', quatro(50), COMO)).ok).toBe(true);
    });
    it.each([
      ['nota 51', [...quatro(10).slice(0, 3), { numero: 4, nota: 51 }]],
      ['nota -1', [...quatro(10).slice(0, 3), { numero: 4, nota: -1 }]],
      ['3 grupos', quatro(10).slice(0, 3)],
      ['5 grupos', [...quatro(10), { numero: 5, nota: 1 }]],
      ['repetido', [...quatro(10).slice(0, 3), { numero: 3, nota: 1 }]],
    ])('%s → invalido', async (_n, respostas) => {
      expect(await enviar('temperamento-pessoal', respostas, COMO)).toEqual({ ok: false, erro: 'invalido' });
    });
  });

  describe('erros da API', () => {
    it('400 → recusado', async () => {
      enviarMock.mockRejectedValue(new EbaApiError(400, 'X'));
      expect(await enviar('dons-servico', notas(3, 1), COMO)).toEqual({ ok: false, erro: 'recusado' });
    });
    it.each([[500], [503], [404], [401]])('status %i → indisponivel', async (status) => {
      enviarMock.mockRejectedValue(new EbaApiError(status, null));
      expect(await enviar('dons-servico', notas(3, 1), COMO)).toEqual({ ok: false, erro: 'indisponivel' });
    });
    it('EbaApiIndisponivel → indisponivel', async () => {
      enviarMock.mockRejectedValue(new EbaApiIndisponivel('timeout'));
      expect(await enviar('dons-servico', notas(3, 1), COMO)).toEqual({ ok: false, erro: 'indisponivel' });
    });
    it('2xx com resultado fora do formato: as respostas já foram gravadas → sucesso sem-resultado', async () => {
      enviarMock.mockRejectedValue(new EbaApiRespostaInvalida('SurveyResponse sem lista de name/totalRate'));
      expect(await enviar('dons-servico', notas(3, 1), COMO)).toEqual({ ok: true, dados: { tipo: 'sem-resultado' } });
    });
    it.each([
      ['vazio 201', '', 201],
      ['HTML do APIM 200', '<html>ok</html>', 200],
    ])('2xx com corpo não JSON (%s), pelo client real → sem-resultado, sem indisponivel', async (_caso, corpo, status) => {
      const { enviarRespostas: real } = jest.requireActual<typeof import('@/lib/eba-api/respostas')>('@/lib/eba-api/respostas');
      enviarMock.mockImplementation(real);
      const fetchOriginal = global.fetch;
      const envOriginal = { ...process.env };
      Object.assign(process.env, { EBA_API_URL: 'https://eba.exemplo.test', EBA_API_KEY: 'chave-teste' });
      const fetchMock = jest.fn().mockResolvedValue(new Response(corpo, { status }));
      global.fetch = fetchMock;
      try {
        expect(await enviar('dons-servico', notas(3, 1), COMO)).toEqual({ ok: true, dados: { tipo: 'sem-resultado' } });
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0][1].method).toBe('POST');
      } finally {
        global.fetch = fetchOriginal;
        process.env = envOriginal;
      }
    });
    it('erro inesperado → indisponivel', async () => {
      enviarMock.mockRejectedValue(new Error('boom'));
      expect(await enviar('dons-servico', notas(3, 1), COMO)).toEqual({ ok: false, erro: 'indisponivel' });
    });
  });
});

describe('sair e sessaoAtual', () => {
  it('sair apaga o cookie no mesmo path', async () => {
    await sair();
    expect(cookieDelete).toHaveBeenCalledWith({ name: COOKIE_SESSAO, path: OPCOES_COOKIE.path });
  });

  it('sessaoAtual devolve só o e-mail mascarado', async () => {
    comSessao(sessaoValida());
    expect(await sessaoAtual()).toEqual({ emailMascarado: 'a***@exemplo.com' });
  });

  it.each([
    ['sem cookie', undefined],
    ['expirada', sessaoValida(Date.now() - 7_200_001)],
  ])('sessaoAtual %s → null', async (_n, valor) => {
    comSessao(valor);
    expect(await sessaoAtual()).toBeNull();
  });

  it.each([
    ['expirada', sessaoValida(Date.now() - 7_200_001)],
    ['adulterada', 'a.b'],
  ])('sessaoAtual %s: apaga o cookie', async (_n, valor) => {
    comSessao(valor);
    expect(await sessaoAtual()).toBeNull();
    expect(cookieDelete).toHaveBeenCalledWith({ name: COOKIE_SESSAO, path: OPCOES_COOKIE.path });
  });

  it('sessaoAtual sem cookie ou com sessão válida: não apaga', async () => {
    await sessaoAtual();
    comSessao(sessaoValida());
    await sessaoAtual();
    expect(cookieDelete).not.toHaveBeenCalled();
  });

  it('sessaoAtual durante a renderização (cookie só leitura): devolve null sem lançar', async () => {
    comSessao('a.b');
    cookieDelete.mockImplementation(() => {
      throw new Error('Cookies can only be modified in a Server Action or Route Handler.');
    });
    await expect(sessaoAtual()).resolves.toBeNull();
  });

  it('sessaoAtual com segredo ausente → null', async () => {
    comSessao(sessaoValida());
    delete process.env.EBA_SESSAO_SEGREDO;
    expect(await sessaoAtual()).toBeNull();
  });

  it('sessaoAtual com API não configurada → null', async () => {
    comSessao(sessaoValida());
    configuradaMock.mockReturnValue(false);
    expect(await sessaoAtual()).toBeNull();
  });
});

describe('privacidade dos logs', () => {
  it('nenhum console.* recebe o e-mail, o nome ou ids, em nenhuma ação', async () => {
    const nome = 'Ana Silva Secreta';
    alunoPorEmailMock.mockRejectedValueOnce(new EbaApiError(503, 'COD'));
    await identificar(EMAIL);
    alunoPorEmailMock.mockRejectedValueOnce(new EbaApiIndisponivel('rede'));
    await identificar(EMAIL);
    alunoPorEmailMock.mockResolvedValueOnce(null);
    turmasMock.mockRejectedValueOnce(new EbaApiIndisponivel('rede'));
    await identificar(EMAIL);
    cadastrarAlunoMock.mockRejectedValueOnce(new EbaApiError(400, 'COD'));
    await cadastrar({ email: EMAIL, nome, unidade: 'colorado', idTurma: 'turma-1' });
    comSessao(sessaoValida());
    perguntasMock.mockResolvedValue(perguntas(3));
    enviarMock.mockRejectedValueOnce(new EbaApiError(400, 'COD'));
    await enviar('dons-servico', notas(3, 1), COMO);
    enviarMock.mockRejectedValueOnce(new EbaApiError(500, 'COD'));
    await enviar('dons-servico', notas(3, 1), COMO);
    await sessaoAtual();
    await sair();

    expect(warn).toHaveBeenCalled();
    const tudo = JSON.stringify([...warn.mock.calls, ...log.mock.calls, ...error.mock.calls]);
    for (const segredo of [EMAIL, 'ana.silva', nome, 'aluno-1', 'turma-1', SEGREDO]) {
      expect(tudo).not.toContain(segredo);
    }
    expect(tudo).toContain('[eba-testes]');
  });
});
