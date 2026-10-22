import { criarLimitador, ipDoCliente, ipParaLimite, proxiesConfiaveis, reiniciarAvisosDoLimite } from './limite';

const MINUTO = 60_000;

describe('criarLimitador', () => {
  it('permite 10 tentativas, nega a 11ª no mesmo minuto e libera depois da janela', () => {
    const permitir = criarLimitador(10, MINUTO);
    const t0 = 1_000_000;
    for (let i = 0; i < 10; i++) expect(permitir('1.1.1.1', t0 + i)).toBe(true);
    expect(permitir('1.1.1.1', t0 + 20)).toBe(false);
    expect(permitir('1.1.1.1', t0 + MINUTO + 20)).toBe(true);
  });

  it('conta cada chave separadamente', () => {
    const permitir = criarLimitador(1, MINUTO);
    expect(permitir('a', 0)).toBe(true);
    expect(permitir('a', 1)).toBe(false);
    expect(permitir('b', 1)).toBe(true);
  });

  it('não conta tentativas negadas como novas (a janela anda só com as permitidas)', () => {
    const permitir = criarLimitador(1, MINUTO);
    expect(permitir('a', 0)).toBe(true);
    expect(permitir('a', MINUTO - 1)).toBe(false);
    expect(permitir('a', MINUTO + 1)).toBe(true);
  });

  it('descarta as tentativas vencidas da chave ao conferi-la', () => {
    const permitir = criarLimitador(2, MINUTO);
    expect(permitir('a', 0)).toBe(true);
    expect(permitir('a', 10)).toBe(true);
    expect(permitir('a', 20)).toBe(false);
    // só a tentativa de t=0 venceu: sobra uma vaga
    expect(permitir('a', MINUTO + 5)).toBe(true);
    expect(permitir('a', MINUTO + 6)).toBe(false);
  });

  it('remove a chave mais antiga quando passa do limite de chaves', () => {
    const permitir = criarLimitador(1, MINUTO, 2);
    expect(permitir('a', 0)).toBe(true);
    expect(permitir('b', 1)).toBe(true);
    expect(permitir('c', 2)).toBe(true); // 'a' (a mais antiga) é descartada
    expect(permitir('b', 3)).toBe(false);
    expect(permitir('a', 4)).toBe(true); // esquecida, começa do zero
  });
});

describe('ipDoCliente (x-forwarded-for atrás de proxies confiáveis)', () => {
  it('1 proxy confiável (ingress): usa o último item, que o proxy acrescentou', () => {
    expect(ipDoCliente('203.0.113.7', 1)).toBe('203.0.113.7');
    expect(ipDoCliente('1.2.3.4, 203.0.113.7', 1)).toBe('203.0.113.7');
  });

  it('IP forjado pelo cliente no começo do cabeçalho não muda a chave do limite', () => {
    expect(ipDoCliente('9.9.9.1, 203.0.113.7', 1)).toBe(ipDoCliente('9.9.9.2, 203.0.113.7', 1));
  });

  it('2 proxies confiáveis (ex.: Front Door + ingress): pula o último e usa o penúltimo', () => {
    expect(ipDoCliente('1.2.3.4, 203.0.113.7, 10.0.0.1', 2)).toBe('203.0.113.7');
  });

  it('cabeçalho ausente, vazio ou mais curto que a cadeia: chave "local" ou o primeiro item', () => {
    expect(ipDoCliente(null, 1)).toBe('local');
    expect(ipDoCliente('  ', 1)).toBe('local');
    expect(ipDoCliente('203.0.113.7', 3)).toBe('203.0.113.7');
  });

  it('quantidade de proxies inválida vale 1', () => {
    expect(ipDoCliente('1.2.3.4, 203.0.113.7', 0)).toBe('203.0.113.7');
    expect(ipDoCliente('1.2.3.4, 203.0.113.7', Number.NaN)).toBe('203.0.113.7');
  });
});

describe('proxiesConfiaveis (EBA_PROXIES_CONFIAVEIS)', () => {
  it.each([['2', 2], ['1', 1], ['3', 3], [undefined, 1], ['', 1], ['abc', 1], ['0', 1], ['-1', 1], ['1.5', 1]])('%p → %p', (valor, esperado) => {
    expect(proxiesConfiaveis({ EBA_PROXIES_CONFIAVEIS: valor } as unknown as NodeJS.ProcessEnv)).toBe(esperado);
  });
});

describe('ipParaLimite (avisos de configuração do limite por IP)', () => {
  let aviso: jest.SpyInstance;
  const env = process.env as Record<string, string | undefined>;
  const original = { NODE_ENV: env.NODE_ENV, proxies: env.EBA_PROXIES_CONFIAVEIS };
  beforeEach(() => {
    reiniciarAvisosDoLimite();
    aviso = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });
  afterEach(() => {
    aviso.mockRestore();
    env.NODE_ENV = original.NODE_ENV;
    if (original.proxies === undefined) delete env.EBA_PROXIES_CONFIAVEIS;
    else env.EBA_PROXIES_CONFIAVEIS = original.proxies;
  });

  it('usa a variável para escolher o IP (2 proxies: o penúltimo item)', () => {
    env.EBA_PROXIES_CONFIAVEIS = '2';
    expect(ipParaLimite('9.9.9.9, 203.0.113.7, 10.0.0.1')).toBe('203.0.113.7');
  });

  it('em produção sem a variável: usa 1 e avisa uma única vez (sem IP no aviso)', () => {
    env.NODE_ENV = 'production';
    delete env.EBA_PROXIES_CONFIAVEIS;
    expect(ipParaLimite('203.0.113.7')).toBe('203.0.113.7');
    ipParaLimite('203.0.113.8');
    const avisos = aviso.mock.calls.map(([m]) => String(m)).filter((m) => m.includes('EBA_PROXIES_CONFIAVEIS'));
    expect(avisos).toHaveLength(1);
    expect(JSON.stringify(aviso.mock.calls)).not.toContain('203.0.113');
  });

  it('em produção sem x-forwarded-for: todas as tentativas dividem uma chave, e o aviso aparece uma vez', () => {
    env.NODE_ENV = 'production';
    env.EBA_PROXIES_CONFIAVEIS = '1';
    expect(ipParaLimite(null)).toBe('local');
    ipParaLimite(undefined);
    expect(aviso.mock.calls.filter(([m]) => String(m).includes('x-forwarded-for'))).toHaveLength(1);
  });

  it('fora de produção não avisa nada (desenvolvimento local não tem proxy)', () => {
    env.NODE_ENV = 'development';
    delete env.EBA_PROXIES_CONFIAVEIS;
    ipParaLimite(null);
    expect(aviso).not.toHaveBeenCalled();
  });
});
