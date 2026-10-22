/** @jest-environment node */
import { aquecer, cadastrar, carregarPerguntas, confirmarCodigo, enviar, pedirCodigo, retomarCadastro, sair, sessaoAtual } from './acoes';
import { assinarMarca, COOKIE_APARELHO, COOKIE_EMAIL_VERIFICADO } from '@/lib/eba/aparelho';
import { hashDoCodigo, hashDoEmail } from '@/lib/eba/verificacao';
import { EmailIndisponivel, emailConfigurado, enviarEmail } from '@/lib/email/mailersend';
import { conferirVerificacao, emitirVerificacao, VerificacaoIndisponivel, verificacaoConfigurada } from '@/lib/strapi/verificacao';
import { assinarSessao, COOKIE_SESSAO, donoDaSessao, OPCOES_COOKIE } from '@/lib/eba/sessao';
import { alunoPorEmail, cadastrarAluno } from '@/lib/eba-api/alunos';
import { EbaApiError, EbaApiIndisponivel, EbaApiRespostaInvalida, ebaApiConfigurada } from '@/lib/eba-api/client';
import { perguntasDoTeste } from '@/lib/eba-api/perguntas';
import { enviarRespostas, type Resultado } from '@/lib/eba-api/respostas';
import { aquecerApi, turmasAtivas } from '@/lib/eba-api/turmas';

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
jest.mock('@/lib/eba-api/turmas', () => ({ turmasAtivas: jest.fn(), aquecerApi: jest.fn() }));
jest.mock('@/lib/strapi/verificacao', () => ({
  ...jest.requireActual('@/lib/strapi/verificacao'),
  emitirVerificacao: jest.fn(),
  conferirVerificacao: jest.fn(),
  verificacaoConfigurada: jest.fn(),
}));
jest.mock('@/lib/email/mailersend', () => ({
  ...jest.requireActual('@/lib/email/mailersend'),
  enviarEmail: jest.fn(),
  emailConfigurado: jest.fn(),
}));
// Envio único real, recriado a cada teste (o guardado é do módulo e não deve vazar entre testes).
jest.mock('@/lib/eba/envio-unico', () => {
  const real = jest.requireActual('@/lib/eba/envio-unico');
  const recriar: Array<() => void> = [];
  return {
    criarEnvioUnico: (...args: unknown[]) => {
      let atual = real.criarEnvioUnico(...args);
      recriar.push(() => (atual = real.criarEnvioUnico(...args)));
      return (...chamada: unknown[]) => atual(...chamada);
    },
    recriarTodos: () => recriar.forEach((r) => r()),
  };
});

const SEGREDO = 'segredo-de-teste-com-mais-de-32-caracteres';
const EMAIL = 'ana.silva@exemplo.com';
/** Dono opaco da sessão de `sessaoValida()` (aluno-1): dono das respostas enviadas. */
const COMO = donoDaSessao('aluno-1', SEGREDO);
const TURMAS = [{ id: 'turma-1', nome: 'Turma 1' }];
const resultado: Resultado = { tipo: 'pontuacao', itens: [], maximo: 25 };

const alunoPorEmailMock = jest.mocked(alunoPorEmail);
const cadastrarAlunoMock = jest.mocked(cadastrarAluno);
const turmasMock = jest.mocked(turmasAtivas);
const perguntasMock = jest.mocked(perguntasDoTeste);
const enviarMock = jest.mocked(enviarRespostas);
const configuradaMock = jest.mocked(ebaApiConfigurada);
const aquecerApiMock = jest.mocked(aquecerApi);
const emitirMock = jest.mocked(emitirVerificacao);
const conferirMock = jest.mocked(conferirVerificacao);
const verificacaoConfiguradaMock = jest.mocked(verificacaoConfigurada);
const enviarEmailMock = jest.mocked(enviarEmail);
const emailConfiguradoMock = jest.mocked(emailConfigurado);
/** Timeouts esperados (API fria): ações 45 s, envio 60 s. */
const ACAO = { timeoutMs: 45_000 };
const ENVIO = { timeoutMs: 60_000 };
/** Aquecimento: timeout curto, para não segurar a fila de Server Actions. */
const AQUECER = { timeoutMs: 8_000 };

let ipSeq = 0;
function sessaoValida(emitidoEm = Date.now()) {
  return assinarSessao(
    { idStudent: 'aluno-1', idClass: 'turma-1', emailMascarado: 'a***@exemplo.com', emitidoEm },
    SEGREDO,
  );
}
/** Cookies que o servidor recebe neste teste (nome → valor). */
let cookiesDoPedido: Record<string, string> = {};
function comCookie(nome: string, valor: string | undefined) {
  if (valor) cookiesDoPedido[nome] = valor;
  else delete cookiesDoPedido[nome];
  cookieGet.mockImplementation((n: string) => (cookiesDoPedido[n] ? { value: cookiesDoPedido[n] } : undefined));
}
function comSessao(valor: string | undefined) {
  comCookie(COOKIE_SESSAO, valor);
}
/** Marca assinada para o e-mail (aparelho lembrado ou e-mail verificado). */
const marca = (email: string, emitidoEm = Date.now()) => assinarMarca(hashDoEmail(email, SEGREDO), SEGREDO, emitidoEm);
const nomesGravados = () => cookieSet.mock.calls.map(([nome]) => nome);
const perguntas = (n: number) => Array.from({ length: n }, (_, i) => ({ numero: i + 1, texto: `p${i + 1}` }));
const notas = (n: number, nota: number) => Array.from({ length: n }, (_, i) => ({ numero: i + 1, nota }));

let warn: jest.SpyInstance;
let log: jest.SpyInstance;
let error: jest.SpyInstance;

beforeEach(() => {
  jest.resetAllMocks();
  jest.requireMock<{ recriarTodos: () => void }>('@/lib/eba/envio-unico').recriarTodos();
  process.env.EBA_SESSAO_SEGREDO = SEGREDO;
  configuradaMock.mockReturnValue(true);
  // IP distinto por teste (último item: o que o ingress acrescenta): o limitador é do módulo e não deve vazar entre testes
  delete process.env.EBA_PROXIES_CONFIAVEIS;
  headerGet.mockImplementation(() => `1.1.1.1, 10.0.0.${++ipSeq}`);
  cookiesDoPedido = {};
  comSessao(undefined);
  turmasMock.mockResolvedValue(TURMAS);
  verificacaoConfiguradaMock.mockReturnValue(true);
  emailConfiguradoMock.mockReturnValue(true);
  emitirMock.mockResolvedValue('emitido');
  enviarEmailMock.mockResolvedValue(undefined);
  warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => {
  jest.restoreAllMocks();
});

describe('pedirCodigo', () => {
  const ENVIADO = { ok: true, dados: { codigoEnviado: true, emailMascarado: 'a***@exemplo.com' } };

  it.each([
    ['cadastrado', { idStudent: 'aluno-1', idClass: 'turma-1' }],
    ['não cadastrado', null],
  ])('e-mail %s sem aparelho lembrado: a mesma resposta, código enviado e nada da API da EBA', async (_n, aluno) => {
    alunoPorEmailMock.mockResolvedValue(aluno);
    expect(await pedirCodigo(`  ${EMAIL.toUpperCase()} `)).toEqual(ENVIADO);
    expect(alunoPorEmailMock).not.toHaveBeenCalled();
    expect(enviarEmailMock).toHaveBeenCalledTimes(1);
    const [email] = enviarEmailMock.mock.calls[0];
    expect(email.para).toBe(EMAIL);
    const codigo = email.assunto.match(/(\d{6})$/)?.[1] ?? '';
    expect(codigo).toMatch(/^\d{6}$/);
    const emitido = emitirMock.mock.calls[0][0];
    expect(emitido.emailHash).toBe(hashDoEmail(EMAIL, SEGREDO));
    expect(emitido.codigoHash).toBe(hashDoCodigo(emitido.emailHash, codigo, SEGREDO));
    expect(emitido.expiraEm.getTime() - Date.now()).toBeGreaterThan(590_000);
    expect(cookieSet).not.toHaveBeenCalled();
  });

  it('limite de envios no Strapi: mesma resposta e nenhum e-mail', async () => {
    emitirMock.mockResolvedValue('limite');
    expect(await pedirCodigo(EMAIL)).toEqual(ENVIADO);
    expect(enviarEmailMock).not.toHaveBeenCalled();
  });

  it.each([
    ['MailerSend fora', () => enviarEmailMock.mockRejectedValue(new EmailIndisponivel(500))],
    ['Strapi fora', () => emitirMock.mockRejectedValue(new VerificacaoIndisponivel(500))],
  ])('%s → indisponivel, sem o e-mail no log', async (_n, preparar) => {
    preparar();
    expect(await pedirCodigo(EMAIL)).toEqual({ ok: false, erro: 'indisponivel' });
    expect(JSON.stringify([warn.mock.calls, log.mock.calls, error.mock.calls])).not.toContain('ana.silva');
  });

  it('aparelho lembrado para o mesmo e-mail: segue sem código (aluno cadastrado → sessão)', async () => {
    comCookie(COOKIE_APARELHO, marca(EMAIL));
    alunoPorEmailMock.mockResolvedValue({ idStudent: 'aluno-1', idClass: 'turma-1' });
    const r = await pedirCodigo(`  ${EMAIL.toUpperCase()} `);
    expect(r).toEqual({ ok: true, dados: { emailMascarado: 'a***@exemplo.com', dono: COMO } });
    expect(alunoPorEmailMock).toHaveBeenCalledWith(EMAIL, ACAO);
    expect(enviarEmailMock).not.toHaveBeenCalled();
    expect(nomesGravados()).toContain(COOKIE_SESSAO);
  });

  it('aparelho lembrado e e-mail sem cadastro: devolve as turmas e marca o e-mail como verificado', async () => {
    comCookie(COOKIE_APARELHO, marca(EMAIL));
    alunoPorEmailMock.mockResolvedValue(null);
    expect(await pedirCodigo(EMAIL)).toEqual({ ok: true, dados: { novo: true, turmas: TURMAS } });
    expect(turmasMock).toHaveBeenCalledWith(ACAO);
    expect(nomesGravados()).toEqual([COOKIE_EMAIL_VERIFICADO]);
  });

  it('aparelho lembrado da ana e outra pessoa digita outro e-mail: manda código', async () => {
    comCookie(COOKIE_APARELHO, marca(EMAIL));
    expect(await pedirCodigo('alice@exemplo.com')).toEqual({ ok: true, dados: { codigoEnviado: true, emailMascarado: 'a***@exemplo.com' } });
    expect(enviarEmailMock).toHaveBeenCalledTimes(1);
    expect(alunoPorEmailMock).not.toHaveBeenCalled();
  });

  it('aparelho lembrado vencido (7 dias + 1 ms): manda código', async () => {
    comCookie(COOKIE_APARELHO, marca(EMAIL, Date.now() - 604_800_001));
    expect(await pedirCodigo(EMAIL)).toEqual(ENVIADO);
  });

  it('e-mail inválido ou com mais de 254 caracteres → invalido, sem enviar nada', async () => {
    expect(await pedirCodigo('nao-e-email')).toEqual({ ok: false, erro: 'invalido' });
    expect(await pedirCodigo(`${'a'.repeat(250)}@x.com`)).toEqual({ ok: false, erro: 'invalido' });
    expect(await pedirCodigo(undefined as unknown as string)).toEqual({ ok: false, erro: 'invalido' });
    expect(emitirMock).not.toHaveBeenCalled();
    expect(enviarEmailMock).not.toHaveBeenCalled();
  });

  it('a 11ª chamada no minuto, do mesmo IP, devolve limite antes de validar ou chamar a API', async () => {
    headerGet.mockReturnValue('8.8.8.8, 9.9.9.9');
    alunoPorEmailMock.mockResolvedValue(null);
    for (let i = 0; i < 10; i++) expect((await pedirCodigo(EMAIL)).ok).toBe(true);
    alunoPorEmailMock.mockClear();
    expect(await pedirCodigo(EMAIL)).toEqual({ ok: false, erro: 'limite' });
    expect(await pedirCodigo('lixo')).toEqual({ ok: false, erro: 'limite' });
    expect(alunoPorEmailMock).not.toHaveBeenCalled();
  });

  it('trocar o IP forjado no começo do x-forwarded-for não fura o limite (vale o item do ingress)', async () => {
    let forjado = 0;
    headerGet.mockImplementation(() => `6.6.${++forjado}.1, 4.4.4.4`);
    alunoPorEmailMock.mockResolvedValue(null);
    for (let i = 0; i < 10; i++) expect((await pedirCodigo(EMAIL)).ok).toBe(true);
    expect(await pedirCodigo(EMAIL)).toEqual({ ok: false, erro: 'limite' });
  });

  it('EBA_PROXIES_CONFIAVEIS=2: a chave é o penúltimo item (cliente antes do Front Door + ingress)', async () => {
    process.env.EBA_PROXIES_CONFIAVEIS = '2';
    let proxy = 0;
    headerGet.mockImplementation(() => `3.3.3.3, 10.9.9.${++proxy}`);
    alunoPorEmailMock.mockResolvedValue(null);
    for (let i = 0; i < 10; i++) expect((await pedirCodigo(EMAIL)).ok).toBe(true);
    expect(await pedirCodigo(EMAIL)).toEqual({ ok: false, erro: 'limite' });
  });

  it('sem x-forwarded-for usa a chave local', async () => {
    headerGet.mockReturnValue(null);
    alunoPorEmailMock.mockResolvedValue(null);
    expect((await pedirCodigo(EMAIL)).ok).toBe(true);
  });

  it.each([
    ['sem token do MailerSend', () => emailConfiguradoMock.mockReturnValue(false)],
    ['sem token das verificações', () => verificacaoConfiguradaMock.mockReturnValue(false)],
    ['API da EBA não configurada', () => configuradaMock.mockReturnValue(false)],
    ['sem segredo', () => delete process.env.EBA_SESSAO_SEGREDO],
  ])('%s → indisponivel, sem enviar nada', async (_n, preparar) => {
    preparar();
    expect(await pedirCodigo(EMAIL)).toEqual({ ok: false, erro: 'indisponivel' });
    expect(enviarEmailMock).not.toHaveBeenCalled();
    expect(emitirMock).not.toHaveBeenCalled();
  });
});

describe('confirmarCodigo', () => {
  const emailHash = () => hashDoEmail(EMAIL, SEGREDO);

  it('código colado com espaço ou traço: confere só os 6 dígitos', async () => {
    conferirMock.mockResolvedValue({ resultado: 'errado', restantes: 4 });
    await confirmarCodigo(EMAIL, ' 123 456\n');
    await confirmarCodigo(EMAIL, '123-456');
    for (const [chamada] of conferirMock.mock.calls) {
      expect(chamada).toEqual({ emailHash: emailHash(), codigoHash: hashDoCodigo(emailHash(), '123456', SEGREDO) });
    }
  });

  it.each(['12345', '1234567', 'abcdef', ''])('código %j → invalido sem chamar o Strapi', async (codigo) => {
    expect(await confirmarCodigo(EMAIL, codigo)).toEqual({ ok: false, erro: 'invalido' });
    expect(conferirMock).not.toHaveBeenCalled();
  });

  it('certo + aluno cadastrado: abre a sessão e lembra o aparelho por 7 dias', async () => {
    conferirMock.mockResolvedValue({ resultado: 'ok', restantes: 4 });
    alunoPorEmailMock.mockResolvedValue({ idStudent: 'aluno-1', idClass: 'turma-1' });
    expect(await confirmarCodigo(` ${EMAIL.toUpperCase()}`, '123456')).toEqual({ ok: true, dados: { emailMascarado: 'a***@exemplo.com', dono: COMO } });
    expect(cookieSet).toHaveBeenCalledWith(COOKIE_SESSAO, expect.any(String), OPCOES_COOKIE);
    expect(cookieSet).toHaveBeenCalledWith(COOKIE_APARELHO, expect.any(String), { ...OPCOES_COOKIE, maxAge: 604_800 });
  });

  it('certo + e-mail novo: devolve as turmas e marca o e-mail como verificado por 15 min', async () => {
    conferirMock.mockResolvedValue({ resultado: 'ok', restantes: 4 });
    alunoPorEmailMock.mockResolvedValue(null);
    expect(await confirmarCodigo(EMAIL, '123456')).toEqual({ ok: true, dados: { novo: true, turmas: TURMAS } });
    expect(cookieSet).toHaveBeenCalledWith(COOKIE_EMAIL_VERIFICADO, expect.any(String), { ...OPCOES_COOKIE, maxAge: 900 });
    expect(nomesGravados()).not.toContain(COOKIE_SESSAO);
  });

  it.each([
    [{ resultado: 'errado', restantes: 3 }],
    [{ resultado: 'vencido', restantes: 0 }],
    [{ resultado: 'esgotado', restantes: 0 }],
  ] as const)('%j → erro "codigo" com o resultado, sem cookie nem API da EBA', async (conferido) => {
    conferirMock.mockResolvedValue(conferido);
    expect(await confirmarCodigo(EMAIL, '123456')).toEqual({ ok: false, erro: 'codigo', ...conferido });
    expect(cookieSet).not.toHaveBeenCalled();
    expect(alunoPorEmailMock).not.toHaveBeenCalled();
  });

  it.each([
    ['Strapi fora', () => conferirMock.mockRejectedValue(new VerificacaoIndisponivel())],
    ['API da EBA fora depois do código certo', () => {
      conferirMock.mockResolvedValue({ resultado: 'ok', restantes: 4 });
      alunoPorEmailMock.mockRejectedValue(new EbaApiIndisponivel('rede'));
    }],
  ])('%s → indisponivel, sem sessão', async (_n, preparar) => {
    preparar();
    expect(await confirmarCodigo(EMAIL, '123456')).toEqual({ ok: false, erro: 'indisponivel' });
    expect(nomesGravados()).not.toContain(COOKIE_SESSAO);
  });

  it('e-mail inválido → invalido', async () => {
    expect(await confirmarCodigo('nao-e-email', '123456')).toEqual({ ok: false, erro: 'invalido' });
  });
});

describe('retomarCadastro', () => {
  it('com o e-mail verificado: devolve as turmas de novo', async () => {
    comCookie(COOKIE_EMAIL_VERIFICADO, marca(EMAIL));
    alunoPorEmailMock.mockResolvedValue(null);
    expect(await retomarCadastro(EMAIL)).toEqual({ ok: true, dados: { novo: true, turmas: TURMAS } });
  });

  it('com o e-mail verificado e o aluno já cadastrado (outro aparelho): abre a sessão', async () => {
    comCookie(COOKIE_EMAIL_VERIFICADO, marca(EMAIL));
    alunoPorEmailMock.mockResolvedValue({ idStudent: 'aluno-1', idClass: 'turma-1' });
    expect(await retomarCadastro(EMAIL)).toEqual({ ok: true, dados: { emailMascarado: 'a***@exemplo.com', dono: COMO } });
  });

  it.each([
    ['sem marca', undefined],
    ['marca de outro e-mail', 'alice@exemplo.com'],
  ])('%s → verificacao, sem chamar a API', async (_n, outro) => {
    if (outro) comCookie(COOKIE_EMAIL_VERIFICADO, marca(outro));
    expect(await retomarCadastro(EMAIL)).toEqual({ ok: false, erro: 'verificacao' });
    expect(alunoPorEmailMock).not.toHaveBeenCalled();
  });
});

describe('cadastrar', () => {
  const dados = { email: EMAIL, nome: '  Ana Silva ', unidade: 'colorado', idTurma: 'turma-1' };
  beforeEach(() => {
    alunoPorEmailMock.mockResolvedValue(null);
    comCookie(COOKIE_EMAIL_VERIFICADO, marca(EMAIL));
  });

  it.each([
    ['sem e-mail verificado', undefined],
    ['com a marca de outro e-mail', 'alice@exemplo.com'],
  ])('%s → verificacao, sem chamar a API', async (_n, outro) => {
    comCookie(COOKIE_EMAIL_VERIFICADO, outro ? marca(outro) : undefined);
    expect(await cadastrar(dados)).toEqual({ ok: false, erro: 'verificacao' });
    expect(alunoPorEmailMock).not.toHaveBeenCalled();
    expect(cadastrarAlunoMock).not.toHaveBeenCalled();
  });

  it('ao abrir a sessão: lembra o aparelho e apaga a marca do e-mail verificado', async () => {
    cadastrarAlunoMock.mockResolvedValue({ idStudent: 'aluno-9', idClass: 'turma-1' });
    await cadastrar(dados);
    expect(nomesGravados()).toEqual(expect.arrayContaining([COOKIE_SESSAO, COOKIE_APARELHO]));
    expect(cookieDelete).toHaveBeenCalledWith({ name: COOKIE_EMAIL_VERIFICADO, path: OPCOES_COOKIE.path });
  });

  it('confere o e-mail (normalizado) antes do POST', async () => {
    cadastrarAlunoMock.mockResolvedValue({ idStudent: 'aluno-9', idClass: 'turma-1' });
    await cadastrar({ ...dados, email: ` ${EMAIL.toUpperCase()} ` });
    expect(alunoPorEmailMock).toHaveBeenCalledWith(EMAIL, ACAO);
    expect(alunoPorEmailMock.mock.invocationCallOrder[0]).toBeLessThan(cadastrarAlunoMock.mock.invocationCallOrder[0]);
  });

  it('e-mail que já existe: abre a sessão do aluno encontrado e não faz o POST', async () => {
    alunoPorEmailMock.mockResolvedValue({ idStudent: 'aluno-1', idClass: 'turma-1' });
    const r = await cadastrar(dados);
    expect(r).toEqual({ ok: true, dados: { emailMascarado: 'a***@exemplo.com', dono: COMO } });
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
    expect(r).toEqual({ ok: true, dados: { emailMascarado: 'a***@exemplo.com', dono: donoDaSessao('aluno-9', SEGREDO) } });
    expect(cadastrarAlunoMock).toHaveBeenCalledWith(
      {
        nome: 'Ana Silva',
        email: EMAIL,
        unidade: 'colorado',
        idTurma: 'turma-1',
      },
      ACAO,
    );
    expect(turmasMock).toHaveBeenCalledWith(ACAO);
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

  it('limite por IP: a 7ª chamada no minuto → limite, sem chamar a API', async () => {
    headerGet.mockImplementation(() => '1.1.1.1, 10.9.9.9');
    for (let i = 0; i < 6; i += 1) await enviar('dons-servico', notas(3, i % 6), COMO);
    enviarMock.mockClear();
    expect(await enviar('dons-servico', notas(3, 4), COMO)).toEqual({ ok: false, erro: 'limite' });
    expect(enviarMock).not.toHaveBeenCalled();
    expect(perguntasMock).toHaveBeenCalledTimes(6);
  });

  it('usa idStudent/idClass da sessão e devolve o resultado', async () => {
    const r = await enviar('dons-servico', notas(3, 4), COMO);
    expect(r).toEqual({ ok: true, dados: resultado });
    expect(enviarMock).toHaveBeenCalledWith(
      {
        slug: 'dons-servico',
        idStudent: 'aluno-1',
        idClass: 'turma-1',
        respostas: notas(3, 4),
      },
      ENVIO,
    );
  });

  it('duas abas enviando as mesmas respostas ao mesmo tempo: uma gravação só na API', async () => {
    let liberar!: (r: Resultado) => void;
    enviarMock.mockImplementation(() => new Promise<Resultado>((ok) => (liberar = ok)));
    const a = enviar('dons-servico', notas(3, 4), COMO);
    const b = enviar('dons-servico', notas(3, 4), COMO);
    await new Promise((ok) => setTimeout(ok, 0));
    liberar(resultado);
    expect(await a).toEqual({ ok: true, dados: resultado });
    expect(await b).toEqual({ ok: true, dados: resultado });
    expect(enviarMock).toHaveBeenCalledTimes(1);
  });

  it('reenvio das mesmas respostas depois do sucesso devolve o mesmo resultado sem gravar de novo', async () => {
    await enviar('dons-servico', notas(3, 4), COMO);
    expect(await enviar('dons-servico', notas(3, 4), COMO)).toEqual({ ok: true, dados: resultado });
    expect(enviarMock).toHaveBeenCalledTimes(1);
  });

  it('2xx com corpo ilegível (a API gravou): o reenvio das mesmas respostas não grava de novo e devolve "sem resultado"', async () => {
    enviarMock.mockRejectedValue(new EbaApiRespostaInvalida('corpo'));
    expect(await enviar('dons-servico', notas(3, 4), COMO)).toEqual({ ok: true, dados: { tipo: 'sem-resultado' } });
    expect(await enviar('dons-servico', notas(3, 4), COMO)).toEqual({ ok: true, dados: { tipo: 'sem-resultado' } });
    expect(enviarMock).toHaveBeenCalledTimes(1);
  });

  it('respostas diferentes ou falha anterior: grava de novo', async () => {
    enviarMock.mockRejectedValueOnce(new EbaApiIndisponivel('rede')).mockResolvedValue(resultado);
    expect(await enviar('dons-servico', notas(3, 4), COMO)).toEqual({ ok: false, erro: 'indisponivel' });
    expect(await enviar('dons-servico', notas(3, 4), COMO)).toEqual({ ok: true, dados: resultado });
    expect(await enviar('dons-servico', notas(3, 2), COMO)).toEqual({ ok: true, dados: resultado });
    expect(enviarMock).toHaveBeenCalledTimes(3);
  });

  it('usa 60 s no envio e 45 s nas perguntas da validação', async () => {
    await enviar('dons-servico', notas(3, 4), COMO);
    expect(enviarMock).toHaveBeenCalledWith(expect.anything(), ENVIO);
    expect(perguntasMock).toHaveBeenCalledWith('dons-servico', ACAO);
  });

  it('ignora ids que o cliente tente mandar dentro das respostas', async () => {
    const maliciosas = notas(3, 1).map((r) => ({ ...r, idStudent: 'outro', idClass: 'outra' }));
    await enviar('dons-servico', maliciosas, COMO);
    expect(enviarMock).toHaveBeenCalledWith(
      expect.objectContaining({ idStudent: 'aluno-1', idClass: 'turma-1', respostas: notas(3, 1) }),
      ENVIO,
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

  it('e-mails com a mesma máscara (ana@ e alice@) não se confundem: respostas da ana não vão para a alice', async () => {
    // A ana respondeu na aba 1; a alice (mesma máscara a***@exemplo.com) entrou na aba 2.
    const sessaoDaAlice = assinarSessao(
      { idStudent: 'aluno-2', idClass: 'turma-1', emailMascarado: 'a***@exemplo.com', emitidoEm: Date.now() },
      SEGREDO,
    );
    comSessao(sessaoDaAlice);
    const r = await enviar('dons-servico', notas(3, 1), COMO);
    expect(r).toEqual({ ok: false, erro: 'sessao' });
    expect(enviarMock).not.toHaveBeenCalled();
  });

  it('o dono das respostas é comparado com a sessão sem normalizar; a máscara de e-mail não vale como dono', async () => {
    expect(await enviar('dons-servico', notas(3, 1), 'a***@exemplo.com')).toEqual({ ok: false, erro: 'sessao' });
    expect(await enviar('dons-servico', notas(3, 1), COMO.toUpperCase())).toEqual({ ok: false, erro: 'sessao' });
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

describe('aquecer', () => {
  it('acorda a API com timeout curto (8 s) e não devolve dados', async () => {
    aquecerApiMock.mockResolvedValue(undefined);
    await expect(aquecer()).resolves.toBeUndefined();
    expect(aquecerApiMock).toHaveBeenCalledTimes(1);
    expect(aquecerApiMock).toHaveBeenCalledWith(AQUECER);
  });

  it('pelo client real: um GET ClassEBA?page-size=1 sem cache, com AbortSignal.timeout(8_000)', async () => {
    const { aquecerApi: real } = jest.requireActual<typeof import('@/lib/eba-api/turmas')>('@/lib/eba-api/turmas');
    aquecerApiMock.mockImplementation(real);
    const fetchOriginal = global.fetch;
    const envOriginal = { ...process.env };
    Object.assign(process.env, { EBA_API_URL: 'https://eba.exemplo.test', EBA_API_KEY: 'chave-teste' });
    const fetchMock = jest.fn().mockResolvedValue(new Response('{"data":[]}', { status: 200 }));
    global.fetch = fetchMock;
    const espiao = jest.spyOn(AbortSignal, 'timeout');
    try {
      await expect(aquecer()).resolves.toBeUndefined();
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(String(url)).toBe('https://eba.exemplo.test/api/v1/eba/ClassEBA?page-size=1');
      expect(init.method).toBe('GET');
      expect(init.cache).toBe('no-store');
      expect(init.next).toBeUndefined();
      expect(espiao).toHaveBeenCalledWith(8_000);
    } finally {
      global.fetch = fetchOriginal;
      process.env = envOriginal;
    }
  });

  it.each([
    ['EbaApiIndisponivel', new EbaApiIndisponivel('timeout')],
    ['EbaApiError', new EbaApiError(503, 'COD')],
    ['erro qualquer', new Error(`falha com ${EMAIL}`)],
    ['valor que não é Error', 'x'],
  ])('nunca lança (%s) e registra só a classe do erro', async (_n, erro) => {
    aquecerApiMock.mockRejectedValue(erro);
    await expect(aquecer()).resolves.toBeUndefined();
    const tudo = JSON.stringify(warn.mock.calls);
    expect(tudo).toContain('[eba-testes] aquecer');
    expect(tudo).not.toContain(EMAIL);
    expect(tudo).not.toContain('COD');
  });

  it('nunca lança, mesmo se a leitura dos cabeçalhos falhar', async () => {
    headerGet.mockImplementation(() => {
      throw new Error('sem cabeçalhos');
    });
    await expect(aquecer()).resolves.toBeUndefined();
    expect(aquecerApiMock).not.toHaveBeenCalled();
  });

  it('limite próprio de 5 por minuto por IP: a 6ª não chama a API e não gasta o limite do pedirCodigo', async () => {
    headerGet.mockReturnValue('8.8.8.8, 5.5.5.5');
    aquecerApiMock.mockResolvedValue(undefined);
    for (let i = 0; i < 6; i++) await aquecer();
    expect(aquecerApiMock).toHaveBeenCalledTimes(5);
    alunoPorEmailMock.mockResolvedValue(null);
    expect((await pedirCodigo(EMAIL)).ok).toBe(true);
  });

  it('API não configurada → não chama a API', async () => {
    configuradaMock.mockReturnValue(false);
    await expect(aquecer()).resolves.toBeUndefined();
    expect(aquecerApiMock).not.toHaveBeenCalled();
  });

  it.each([undefined, 'curto'])('segredo ausente ou curto (%p) → não chama a API', async (segredo) => {
    if (segredo === undefined) delete process.env.EBA_SESSAO_SEGREDO;
    else process.env.EBA_SESSAO_SEGREDO = segredo;
    await expect(aquecer()).resolves.toBeUndefined();
    expect(aquecerApiMock).not.toHaveBeenCalled();
  });
});

describe('carregarPerguntas', () => {
  it('sucesso → lista de perguntas, buscada com 45 s', async () => {
    perguntasMock.mockResolvedValue(perguntas(3));
    expect(await carregarPerguntas('dons-servico')).toEqual({ ok: true, dados: perguntas(3) });
    expect(perguntasMock).toHaveBeenCalledWith('dons-servico', ACAO);
  });

  it.each(['estilo-pessoal', 'temperamento-pessoal'])('%s (sem perguntas da API) → [] sem chamar a API', async (slug) => {
    expect(await carregarPerguntas(slug)).toEqual({ ok: true, dados: [] });
    expect(perguntasMock).not.toHaveBeenCalled();
  });

  it.each([['nao-existe'], [''], ['Dons-Servico'], [undefined], [3]])('slug inválido (%p) → invalido, sem chamar a API', async (slug) => {
    expect(await carregarPerguntas(slug as unknown as string)).toEqual({ ok: false, erro: 'invalido' });
    expect(perguntasMock).not.toHaveBeenCalled();
  });

  it.each([
    ['EbaApiIndisponivel', new EbaApiIndisponivel('timeout')],
    ['EbaApiError', new EbaApiError(503, null)],
    ['EbaApiRespostaInvalida', new EbaApiRespostaInvalida('x')],
  ])('falha (%s) → indisponivel', async (_n, erro) => {
    perguntasMock.mockRejectedValue(erro);
    expect(await carregarPerguntas('dons-servico')).toEqual({ ok: false, erro: 'indisponivel' });
  });

  it('sem configuração ou segredo → indisponivel, sem chamar a API', async () => {
    configuradaMock.mockReturnValue(false);
    expect(await carregarPerguntas('dons-servico')).toEqual({ ok: false, erro: 'indisponivel' });
    configuradaMock.mockReturnValue(true);
    delete process.env.EBA_SESSAO_SEGREDO;
    expect(await carregarPerguntas('dons-servico')).toEqual({ ok: false, erro: 'indisponivel' });
    expect(perguntasMock).not.toHaveBeenCalled();
  });

  it('usa o limite por IP do pedirCodigo', async () => {
    headerGet.mockReturnValue('6.6.6.6');
    perguntasMock.mockResolvedValue(perguntas(3));
    for (let i = 0; i < 10; i++) expect((await carregarPerguntas('dons-servico')).ok).toBe(true);
    expect(await carregarPerguntas('dons-servico')).toEqual({ ok: false, erro: 'limite' });
  });
});

describe('sair e sessaoAtual', () => {
  it('sair apaga a sessão e esquece o aparelho e o e-mail verificado, no mesmo path', async () => {
    await sair();
    expect(cookieDelete).toHaveBeenCalledWith({ name: COOKIE_EMAIL_VERIFICADO, path: OPCOES_COOKIE.path });
    expect(cookieDelete).toHaveBeenCalledWith({ name: COOKIE_SESSAO, path: OPCOES_COOKIE.path });
    expect(cookieDelete).toHaveBeenCalledWith({ name: COOKIE_APARELHO, path: OPCOES_COOKIE.path });
  });

  it('sessaoAtual devolve só o e-mail mascarado', async () => {
    comSessao(sessaoValida());
    expect(await sessaoAtual()).toEqual({ emailMascarado: 'a***@exemplo.com', dono: COMO });
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
    // Aparelho lembrado: o pedirCodigo chega à API da EBA; e-mail verificado: o cadastrar também.
    comCookie(COOKIE_APARELHO, marca(EMAIL));
    comCookie(COOKIE_EMAIL_VERIFICADO, marca(EMAIL));
    alunoPorEmailMock.mockRejectedValueOnce(new EbaApiError(503, 'COD'));
    await pedirCodigo(EMAIL);
    alunoPorEmailMock.mockRejectedValueOnce(new EbaApiIndisponivel('rede'));
    await pedirCodigo(EMAIL);
    alunoPorEmailMock.mockResolvedValueOnce(null);
    turmasMock.mockRejectedValueOnce(new EbaApiIndisponivel('rede'));
    await pedirCodigo(EMAIL);
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
