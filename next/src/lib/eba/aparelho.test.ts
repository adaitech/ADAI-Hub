import {
  assinarMarca,
  COOKIE_APARELHO,
  COOKIE_EMAIL_VERIFICADO,
  COOKIE_RESULTADO_VERIFICADO,
  opcoesCookieResultado,
  lerMarca,
  opcoesCookieMarca,
  VALIDADE_APARELHO_MS,
  VALIDADE_EMAIL_VERIFICADO_MS,
} from './aparelho';
import { OPCOES_COOKIE } from './sessao';

const SEGREDO = 'segredo-de-teste-com-mais-de-32-caracteres';
const T0 = 1_760_000_000_000;

describe('marca do e-mail verificado do pedido do resultado', () => {
  it('cookie próprio, 15 min, no caminho /eba/resultado (os cookies dos testes não valem lá e vice-versa)', () => {
    expect(COOKIE_RESULTADO_VERIFICADO).toBe('eba_resultado_verificado');
    expect(opcoesCookieResultado()).toEqual({ ...OPCOES_COOKIE, path: '/eba/resultado', maxAge: 900 });
  });
});

describe('marcas do aparelho e do e-mail verificado', () => {
  it('nomes e validades da spec', () => {
    expect(COOKIE_APARELHO).toBe('eba_aparelho');
    expect(COOKIE_EMAIL_VERIFICADO).toBe('eba_email_verificado');
    expect(VALIDADE_APARELHO_MS).toBe(7 * 24 * 60 * 60 * 1000);
    expect(VALIDADE_EMAIL_VERIFICADO_MS).toBe(15 * 60 * 1000);
  });

  it('lê a marca dentro da validade', () => {
    const valor = assinarMarca('hash-ana', SEGREDO, T0);
    expect(lerMarca(valor, SEGREDO, T0 + VALIDADE_APARELHO_MS, VALIDADE_APARELHO_MS)).toEqual({ emailHash: 'hash-ana' });
  });

  it.each([
    ['vencida (aparelho: 30 dias + 1 ms)', VALIDADE_APARELHO_MS, VALIDADE_APARELHO_MS + 1],
    ['vencida (e-mail verificado: 15 min + 1 ms)', VALIDADE_EMAIL_VERIFICADO_MS, VALIDADE_EMAIL_VERIFICADO_MS + 1],
    ['emitida mais de 60 s no futuro', VALIDADE_APARELHO_MS, -60_001],
  ])('recusa marca %s', (_n, validade, idade) => {
    expect(lerMarca(assinarMarca('hash-ana', SEGREDO, T0), SEGREDO, T0 + idade, validade)).toBeNull();
  });

  it('recusa marca adulterada ou de outro segredo', () => {
    const valor = assinarMarca('hash-ana', SEGREDO, T0);
    expect(lerMarca(`${valor}x`, SEGREDO, T0, VALIDADE_APARELHO_MS)).toBeNull();
    expect(lerMarca(valor, `${SEGREDO}-outro`, T0, VALIDADE_APARELHO_MS)).toBeNull();
    expect(lerMarca(undefined, SEGREDO, T0, VALIDADE_APARELHO_MS)).toBeNull();
  });

  it('opções do cookie: as da sessão + maxAge em segundos', () => {
    expect(opcoesCookieMarca(VALIDADE_APARELHO_MS)).toEqual({ ...OPCOES_COOKIE, maxAge: 604_800 });
    expect(opcoesCookieMarca(VALIDADE_EMAIL_VERIFICADO_MS).maxAge).toBe(900);
  });
});
