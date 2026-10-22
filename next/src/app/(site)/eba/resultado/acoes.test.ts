/** @jest-environment node */
import { confirmarLinkResultado, pedirCodigoResultado, reenviarLinkResultado } from './acoes';
import { assinarMarca, COOKIE_RESULTADO_VERIFICADO, opcoesCookieResultado } from '@/lib/eba/aparelho';
import { hashDoCodigo, hashDoEmail } from '@/lib/eba/verificacao';
import { lerLinkResultado } from '@/lib/eba/link-resultado';
import { enviarEmail, emailConfigurado } from '@/lib/email/mailersend';
import { cancelarVerificacao, conferirVerificacao, emitirVerificacao, VerificacaoIndisponivel, verificacaoConfigurada } from '@/lib/strapi/verificacao';
import { alunoPorEmail } from '@/lib/eba-api/alunos';
import { EbaApiIndisponivel, ebaApiConfigurada } from '@/lib/eba-api/client';

const headerGet = jest.fn();
const cookieGet = jest.fn();
const cookieSet = jest.fn();
const cookieDelete = jest.fn();
jest.mock('next/headers', () => ({
  headers: async () => ({ get: headerGet }),
  cookies: async () => ({ get: cookieGet, set: cookieSet, delete: cookieDelete }),
}));
jest.mock('@/lib/eba-api/alunos', () => ({ ...jest.requireActual('@/lib/eba-api/alunos'), alunoPorEmail: jest.fn() }));
jest.mock('@/lib/eba-api/client', () => ({ ...jest.requireActual('@/lib/eba-api/client'), ebaApiConfigurada: jest.fn() }));
jest.mock('@/lib/strapi/verificacao', () => ({
  ...jest.requireActual('@/lib/strapi/verificacao'),
  emitirVerificacao: jest.fn(),
  conferirVerificacao: jest.fn(),
  cancelarVerificacao: jest.fn(),
  verificacaoConfigurada: jest.fn(),
}));
jest.mock('@/lib/email/mailersend', () => ({ ...jest.requireActual('@/lib/email/mailersend'), enviarEmail: jest.fn(), emailConfigurado: jest.fn() }));

const SEGREDO = 'segredo-de-teste-com-mais-de-32-caracteres';
const SEGREDO_RESULTADO = 'segredo-do-resultado-com-mais-de-32-caracteres';
const EMAIL = 'ana.silva@exemplo.com';
const ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
const DIA = 86_400_000;

const alunoMock = jest.mocked(alunoPorEmail);
const emitirMock = jest.mocked(emitirVerificacao);
const conferirMock = jest.mocked(conferirVerificacao);
const enviarMock = jest.mocked(enviarEmail);
const ORIGINAL = { ...process.env };
let ipSeq = 0;
let warn: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  process.env.EBA_SESSAO_SEGREDO = SEGREDO;
  process.env.EBA_RESULTADO_SEGREDO = SEGREDO_RESULTADO;
  process.env.NEXT_PUBLIC_SITE_URL = 'https://adai.com.br';
  jest.mocked(ebaApiConfigurada).mockReturnValue(true);
  jest.mocked(emailConfigurado).mockReturnValue(true);
  jest.mocked(verificacaoConfigurada).mockReturnValue(true);
  emitirMock.mockResolvedValue('emitido');
  conferirMock.mockResolvedValue({ resultado: 'ok', restantes: 5 });
  alunoMock.mockResolvedValue({ idStudent: ID, idClass: 'turma-1' } as never);
  enviarMock.mockResolvedValue(undefined);
  cookieGet.mockReturnValue(undefined);
  ipSeq += 1;
  headerGet.mockReturnValue(`203.0.113.${ipSeq}`);
  warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});
afterEach(() => warn.mockRestore());
afterAll(() => {
  process.env = ORIGINAL;
});

describe('pedirCodigoResultado', () => {
  it('guarda só hashes no Strapi e manda o código (variante "resultado") para o e-mail normalizado', async () => {
    const r = await pedirCodigoResultado('  Ana.Silva@Exemplo.com ');
    expect(r).toEqual({ ok: true, dados: { emailMascarado: 'a***@exemplo.com' } });
    const emitido = emitirMock.mock.calls[0][0];
    expect(emitido.emailHash).toBe(hashDoEmail(EMAIL, SEGREDO));
    expect(JSON.stringify(emitido)).not.toContain(EMAIL);
    expect(enviarMock).toHaveBeenCalledTimes(1);
    expect(enviarMock.mock.calls[0][0]).toMatchObject({ para: EMAIL, assunto: expect.stringContaining('ver o resultado dos testes da EBA') });
  });

  it('não consulta a API da EBA: a resposta é a mesma para e-mail de aluno ou não', async () => {
    await pedirCodigoResultado(EMAIL);
    expect(alunoMock).not.toHaveBeenCalled();
  });

  it('limite de envios do e-mail atingido → avisa ("emails"), sem e-mail e sem fingir que enviou', async () => {
    emitirMock.mockResolvedValue('limite');
    expect(await pedirCodigoResultado(EMAIL)).toEqual({ ok: false, erro: 'emails' });
    expect(enviarMock).not.toHaveBeenCalled();
  });

  it('MailerSend fora → cancela a emissão (a cota não é gasta) e responde indisponivel', async () => {
    enviarMock.mockRejectedValue(new Error('x'));
    expect(await pedirCodigoResultado(EMAIL)).toEqual({ ok: false, erro: 'indisponivel' });
    const emitido = emitirMock.mock.calls[0][0];
    expect(jest.mocked(cancelarVerificacao)).toHaveBeenCalledWith({ emailHash: emitido.emailHash, codigoHash: emitido.codigoHash });
  });

  it.each(['', 'sem-arroba', 'a@b', 'x'.repeat(260) + '@y.com'])('e-mail inválido (%p) → invalido', async (email) => {
    expect(await pedirCodigoResultado(email)).toEqual({ ok: false, erro: 'invalido' });
    expect(emitirMock).not.toHaveBeenCalled();
  });

  it.each([
    ['segredo do resultado ausente', () => delete process.env.EBA_RESULTADO_SEGREDO],
    ['segredo da sessão curto', () => (process.env.EBA_SESSAO_SEGREDO = 'curto')],
    ['API da EBA', () => jest.mocked(ebaApiConfigurada).mockReturnValue(false)],
    ['MailerSend', () => jest.mocked(emailConfigurado).mockReturnValue(false)],
    ['Strapi das verificações', () => jest.mocked(verificacaoConfigurada).mockReturnValue(false)],
  ])('%s não configurado → indisponivel (falha fechado)', async (_nome, quebrar) => {
    quebrar();
    expect(await pedirCodigoResultado(EMAIL)).toEqual({ ok: false, erro: 'indisponivel' });
    expect(emitirMock).not.toHaveBeenCalled();
  });

  it('Strapi ou MailerSend fora → indisponivel, e o log só traz a classe do erro', async () => {
    emitirMock.mockRejectedValue(new VerificacaoIndisponivel(500));
    expect(await pedirCodigoResultado(EMAIL)).toEqual({ ok: false, erro: 'indisponivel' });
    expect(JSON.stringify(warn.mock.calls)).not.toContain('exemplo.com');
  });

  it('limite por IP: a 11ª tentativa no minuto → limite', async () => {
    headerGet.mockReturnValue('198.51.100.7');
    for (let i = 0; i < 10; i += 1) await pedirCodigoResultado(EMAIL);
    expect(await pedirCodigoResultado(EMAIL)).toEqual({ ok: false, erro: 'limite' });
  });
});

describe('confirmarLinkResultado', () => {
  it('código certo de aluno → manda o link por e-mail (7 dias) e a resposta não traz o link', async () => {
    const r = await confirmarLinkResultado(EMAIL, '042 137');
    expect(r).toEqual({ ok: true, dados: { emailMascarado: 'a***@exemplo.com' } });
    expect(conferirMock).toHaveBeenCalledWith({ emailHash: hashDoEmail(EMAIL, SEGREDO), codigoHash: hashDoCodigo(hashDoEmail(EMAIL, SEGREDO), '042137', SEGREDO) });
    const { para, texto, html } = enviarMock.mock.calls[0][0];
    expect(para).toBe(EMAIL);
    const link = /https:\/\/adai\.com\.br\/eba\/resultado\/(\S+)/.exec(texto)!;
    expect(html).toContain(link[0]);
    expect(texto).toContain('7 dias');
    // O código do link decifra para o aluno e vale 7 dias.
    expect(lerLinkResultado(link[1], SEGREDO_RESULTADO, Date.now())).toEqual({ idStudent: ID });
    expect(lerLinkResultado(link[1], SEGREDO_RESULTADO, Date.now() + 7 * DIA + 60_000)).toBeNull();
    expect(JSON.stringify(r)).not.toContain('/eba/resultado');
    expect(texto).not.toContain(ID);
  });

  it('grava a marca do e-mail verificado ANTES das chamadas à API e a apaga depois de enviar o link', async () => {
    await confirmarLinkResultado(EMAIL, '042137');
    expect(cookieSet).toHaveBeenCalledWith(COOKIE_RESULTADO_VERIFICADO, expect.any(String), opcoesCookieResultado());
    expect(cookieDelete).toHaveBeenCalledWith({ name: COOKIE_RESULTADO_VERIFICADO, path: '/eba/resultado' });
    expect(cookieSet.mock.invocationCallOrder[0]).toBeLessThan(alunoMock.mock.invocationCallOrder[0]);
  });

  it('e-mail sem cadastro → a MESMA resposta, sem e-mail e sem pistas', async () => {
    alunoMock.mockResolvedValue(null);
    expect(await confirmarLinkResultado(EMAIL, '042137')).toEqual({ ok: true, dados: { emailMascarado: 'a***@exemplo.com' } });
    expect(enviarMock).not.toHaveBeenCalled();
  });

  it.each([['errado', 3], ['vencido', 0], ['esgotado', 0]] as const)('código %s → erro "codigo" com as tentativas restantes, sem consultar a API', async (resultado, restantes) => {
    conferirMock.mockResolvedValue({ resultado, restantes });
    expect(await confirmarLinkResultado(EMAIL, '042137')).toEqual({ ok: false, erro: 'codigo', resultado, restantes });
    expect(alunoMock).not.toHaveBeenCalled();
    expect(enviarMock).not.toHaveBeenCalled();
  });

  it.each(['', '12345', 'abcdef', '1234567'])('código malformado (%p) → invalido, sem conferir', async (codigo) => {
    expect(await confirmarLinkResultado(EMAIL, codigo)).toEqual({ ok: false, erro: 'invalido' });
    expect(conferirMock).not.toHaveBeenCalled();
  });

  it('Strapi fora ao conferir → indisponivel, sem dizer que o código foi aceito', async () => {
    conferirMock.mockRejectedValue(new VerificacaoIndisponivel(500));
    expect(await confirmarLinkResultado(EMAIL, '042137')).toEqual({ ok: false, erro: 'indisponivel' });
    expect(cookieSet).not.toHaveBeenCalled();
  });

  it('API da EBA fora depois do código certo → indisponivel com codigoAceito (o "Tentar de novo" não pede outro código), sem e-mail', async () => {
    alunoMock.mockRejectedValue(new EbaApiIndisponivel('rede'));
    expect(await confirmarLinkResultado(EMAIL, '042137')).toEqual({ ok: false, erro: 'indisponivel', codigoAceito: true });
    expect(enviarMock).not.toHaveBeenCalled();
    expect(cookieDelete).not.toHaveBeenCalled();
  });

  it('MailerSend fora → indisponivel com codigoAceito (o log não traz e-mail nem id)', async () => {
    enviarMock.mockRejectedValue(new Error('x'));
    expect(await confirmarLinkResultado(EMAIL, '042137')).toEqual({ ok: false, erro: 'indisponivel', codigoAceito: true });
    const log = JSON.stringify(warn.mock.calls);
    expect(log).not.toContain(ID);
    expect(log).not.toContain('exemplo.com');
  });

  it('desligado (sem EBA_RESULTADO_SEGREDO) → indisponivel, sem conferir o código', async () => {
    delete process.env.EBA_RESULTADO_SEGREDO;
    expect(await confirmarLinkResultado(EMAIL, '042137')).toEqual({ ok: false, erro: 'indisponivel' });
    expect(conferirMock).not.toHaveBeenCalled();
  });

  it('limite por IP', async () => {
    headerGet.mockReturnValue('198.51.100.8');
    for (let i = 0; i < 10; i += 1) await confirmarLinkResultado(EMAIL, '042137');
    expect(await confirmarLinkResultado(EMAIL, '042137')).toEqual({ ok: false, erro: 'limite' });
  });
});

describe('reenviarLinkResultado ("Tentar de novo" depois do código aceito)', () => {
  const marca = (email = EMAIL, emitidoEm = Date.now()) => assinarMarca(hashDoEmail(email, SEGREDO), SEGREDO, emitidoEm);
  const comMarca = (valor: string | undefined) => cookieGet.mockImplementation((nome: string) => (nome === COOKIE_RESULTADO_VERIFICADO && valor ? { value: valor } : undefined));

  it('com a marca do mesmo e-mail: envia o link sem pedir outro código e apaga a marca', async () => {
    comMarca(marca());
    expect(await reenviarLinkResultado(` ${EMAIL.toUpperCase()}`)).toEqual({ ok: true, dados: { emailMascarado: 'a***@exemplo.com' } });
    expect(conferirMock).not.toHaveBeenCalled();
    const { para, texto } = enviarMock.mock.calls[0][0];
    expect(para).toBe(EMAIL);
    const link = /https:\/\/adai\.com\.br\/eba\/resultado\/(\S+)/.exec(texto)!;
    expect(lerLinkResultado(link[1], SEGREDO_RESULTADO, Date.now())).toEqual({ idStudent: ID });
    expect(cookieDelete).toHaveBeenCalledWith({ name: COOKIE_RESULTADO_VERIFICADO, path: '/eba/resultado' });
  });

  it.each([
    ['sem marca', undefined],
    ['marca de outro e-mail', marca('outra@exemplo.com')],
    ['marca vencida (15 min + 1 ms)', marca(EMAIL, Date.now() - 900_001)],
    ['marca adulterada', marca().slice(0, -3) + 'abc'],
  ])('%s → verificacao (volta ao e-mail), sem enviar nada', async (_n, valor) => {
    comMarca(valor);
    expect(await reenviarLinkResultado(EMAIL)).toEqual({ ok: false, erro: 'verificacao' });
    expect(alunoMock).not.toHaveBeenCalled();
    expect(enviarMock).not.toHaveBeenCalled();
  });

  it('e-mail sem cadastro: a mesma resposta de sucesso, sem e-mail', async () => {
    comMarca(marca());
    alunoMock.mockResolvedValue(null);
    expect(await reenviarLinkResultado(EMAIL)).toEqual({ ok: true, dados: { emailMascarado: 'a***@exemplo.com' } });
    expect(enviarMock).not.toHaveBeenCalled();
  });

  it('API ainda fora → indisponivel com codigoAceito, e a marca continua valendo', async () => {
    comMarca(marca());
    alunoMock.mockRejectedValue(new EbaApiIndisponivel('rede'));
    expect(await reenviarLinkResultado(EMAIL)).toEqual({ ok: false, erro: 'indisponivel', codigoAceito: true });
    expect(cookieDelete).not.toHaveBeenCalled();
  });

  it('e-mail inválido → invalido; desligado → indisponivel; limite por IP', async () => {
    comMarca(marca());
    expect(await reenviarLinkResultado('lixo')).toEqual({ ok: false, erro: 'invalido' });
    delete process.env.EBA_RESULTADO_SEGREDO;
    expect(await reenviarLinkResultado(EMAIL)).toEqual({ ok: false, erro: 'indisponivel' });
    process.env.EBA_RESULTADO_SEGREDO = SEGREDO_RESULTADO;
    headerGet.mockReturnValue('198.51.100.9');
    for (let i = 0; i < 10; i += 1) await reenviarLinkResultado(EMAIL);
    expect(await reenviarLinkResultado(EMAIL)).toEqual({ ok: false, erro: 'limite' });
  });
});
