/** @jest-environment node */
import { selar } from '../selo';
import {
  abrirSessaoEquipe,
  COOKIE_EQUIPE,
  lerSessaoEquipe,
  OPCOES_COOKIE_EQUIPE,
  segredoDaEquipe,
  VALIDADE_MAXIMA_SESSAO_MS,
} from './sessao';

const SEGREDO = 'segredo-da-equipe-com-mais-de-32-caracteres!';
const OUTRO = 'outro-segredo-da-equipe-com-32-caracteres!!';
const AGORA = Date.UTC(2026, 9, 22, 12, 0, 0);
const HORA = 3_600_000;

describe('segredoDaEquipe', () => {
  const original = process.env.EBA_EQUIPE_SEGREDO;
  afterEach(() => {
    if (original === undefined) delete process.env.EBA_EQUIPE_SEGREDO;
    else process.env.EBA_EQUIPE_SEGREDO = original;
  });

  it('ausente ou curto → null (a área fica desligada)', () => {
    delete process.env.EBA_EQUIPE_SEGREDO;
    expect(segredoDaEquipe()).toBeNull();
    process.env.EBA_EQUIPE_SEGREDO = 'curto';
    expect(segredoDaEquipe()).toBeNull();
  });

  it('com 32+ caracteres → o segredo', () => {
    process.env.EBA_EQUIPE_SEGREDO = SEGREDO;
    expect(segredoDaEquipe()).toBe(SEGREDO);
  });
});

describe('sessão da equipe', () => {
  const abrir = (expiresIn = 3600, agora = AGORA) => abrirSessaoEquipe({ accessToken: 'bearer-da-equipe', email: 'ana@adai.com.br', expiresIn }, SEGREDO, agora);

  it('ida e volta devolve o bearer e o e-mail; o valor do cookie é opaco', () => {
    const { valor } = abrir();
    expect(valor).not.toContain('bearer-da-equipe');
    expect(valor).not.toContain('ana@adai');
    expect(Buffer.from(valor.slice(3), 'base64url').toString('utf8')).not.toContain('bearer');
    expect(lerSessaoEquipe(valor, SEGREDO, AGORA + 60_000)).toEqual({ accessToken: 'bearer-da-equipe', email: 'ana@adai.com.br' });
  });

  it('vale pela validade do token, menos 30 s de margem', () => {
    const { valor, expiraEm } = abrir(3600);
    expect(expiraEm).toBe(AGORA + HORA - 30_000);
    expect(lerSessaoEquipe(valor, SEGREDO, expiraEm)).not.toBeNull();
    expect(lerSessaoEquipe(valor, SEGREDO, expiraEm + 1)).toBeNull();
  });

  it('nunca passa de 8 h, mesmo com token mais longo', () => {
    const { valor, expiraEm } = abrir(24 * 3600);
    expect(expiraEm).toBe(AGORA + VALIDADE_MAXIMA_SESSAO_MS);
    expect(lerSessaoEquipe(valor, SEGREDO, AGORA + VALIDADE_MAXIMA_SESSAO_MS + 1)).toBeNull();
  });

  it.each([0, -5, Number.NaN, 20])('expiresIn inválido ou menor que a margem (%p) → não abre sessão', (expiresIn) => {
    expect(() => abrir(expiresIn)).toThrow();
  });

  it('outro segredo, adulterado ou lixo → null', () => {
    const { valor } = abrir();
    expect(lerSessaoEquipe(valor, OUTRO, AGORA)).toBeNull();
    expect(lerSessaoEquipe(valor.slice(0, -2) + 'AA', SEGREDO, AGORA)).toBeNull();
    expect(lerSessaoEquipe(undefined, SEGREDO, AGORA)).toBeNull();
    expect(lerSessaoEquipe('lixo', SEGREDO, AGORA)).toBeNull();
  });

  it('selo de outro uso (ex.: link do resultado) não vale como sessão', () => {
    const outro = selar({ accessToken: 'x', email: 'a@b.com', exp: AGORA + HORA }, SEGREDO, 'resultado');
    expect(lerSessaoEquipe(outro, SEGREDO, AGORA)).toBeNull();
  });

  it('dados incompletos no selo da equipe → null', () => {
    for (const dados of [{ exp: AGORA + HORA }, { accessToken: '', email: 'a@b.com', exp: AGORA + HORA }, { accessToken: 'x', email: 'a@b.com' }, { accessToken: 'x', email: 'a@b.com', exp: 'amanhã' }]) {
      expect(lerSessaoEquipe(selar(dados, SEGREDO, 'equipe'), SEGREDO, AGORA)).toBeNull();
    }
  });
});

describe('cookie da equipe', () => {
  it('httpOnly, sameSite strict, só no caminho da área, de sessão (sem maxAge)', () => {
    expect(COOKIE_EQUIPE).toBe('eba_equipe');
    expect(OPCOES_COOKIE_EQUIPE).toMatchObject({ httpOnly: true, sameSite: 'strict', path: '/eba/equipe' });
    expect(OPCOES_COOKIE_EQUIPE).not.toHaveProperty('maxAge');
    expect(OPCOES_COOKIE_EQUIPE).not.toHaveProperty('expires');
  });
});
