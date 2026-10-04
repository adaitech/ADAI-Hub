import {
  ROTA_RELATORIO_CSP,
  cabecalhosDaApi,
  cabecalhosDaPagina,
  cabecalhosFixos,
  gerarNonce,
  lerConfigSeguranca,
  montarCsp,
  type ConfigSeguranca,
} from './cabecalhos';

const PRODUCAO: ConfigSeguranca = {
  dev: false,
  siteUrl: 'https://adai.com.br',
  strapiUrl: 'https://cms.adai.com.br',
  indexavel: true,
  somenteRelatorio: false,
};
const LOCAL: ConfigSeguranca = { dev: true, siteUrl: 'http://localhost:3000', strapiUrl: 'http://localhost:1337', indexavel: false, somenteRelatorio: false };

/** CSP → { diretiva: valores }. */
function diretivas(csp: string): Record<string, string[]> {
  return Object.fromEntries(
    csp
      .split(';')
      .map((d) => d.trim().split(/\s+/))
      .filter((partes) => partes[0])
      .map(([nome, ...valores]) => [nome, valores]),
  );
}

const valorDe = (lista: { key: string; value: string }[], chave: string) => lista.find((c) => c.key.toLowerCase() === chave.toLowerCase())?.value;

describe('lerConfigSeguranca', () => {
  it('lê do ambiente e guarda só a origem das URLs', () => {
    const config = lerConfigSeguranca({
      NODE_ENV: 'production',
      NEXT_PUBLIC_SITE_URL: 'https://adai.com.br/qualquer/caminho',
      NEXT_PUBLIC_STRAPI_URL: 'https://cms.adai.com.br/',
      SITE_INDEXAVEL: 'true',
      CSP_SOMENTE_RELATORIO: 'true',
    });
    expect(config).toEqual({ dev: false, siteUrl: 'https://adai.com.br', strapiUrl: 'https://cms.adai.com.br', indexavel: true, somenteRelatorio: true });
  });

  it('sem variáveis (ou com URL inválida) cai nos endereços locais e no modo que bloqueia', () => {
    expect(lerConfigSeguranca({ NODE_ENV: 'development', NEXT_PUBLIC_SITE_URL: 'não é url' })).toEqual(LOCAL);
  });
});

describe('gerarNonce', () => {
  it('é aleatório a cada requisição e seguro para o cabeçalho (base64, ≥ 128 bits)', () => {
    const nonces = new Set(Array.from({ length: 50 }, gerarNonce));
    expect(nonces.size).toBe(50);
    for (const nonce of nonces) expect(nonce).toMatch(/^[A-Za-z0-9+/]{22,}={0,2}$/);
  });
});

describe('montarCsp (MDN: CSP estrita com nonce)', () => {
  const csp = diretivas(montarCsp('abc123', PRODUCAO));

  it('script só com nonce + strict-dynamic: sem unsafe-inline, sem unsafe-eval em produção', () => {
    expect(csp['script-src']).toEqual(expect.arrayContaining(["'self'", "'nonce-abc123'", "'strict-dynamic'"]));
    expect(csp['script-src']).not.toContain("'unsafe-inline'");
    expect(csp['script-src']).not.toContain("'unsafe-eval'");
    expect(csp['script-src']).toContain('https://www.googletagmanager.com');
  });

  it('diretivas recomendadas pela MDN', () => {
    expect(csp['default-src']).toEqual(["'self'"]);
    expect(csp['object-src']).toEqual(["'none'"]);
    expect(csp['base-uri']).toEqual(["'none'"]);
    expect(csp['form-action']).toEqual(["'self'"]);
    expect(csp['font-src']).toEqual(["'self'"]);
    expect(csp).toHaveProperty('upgrade-insecure-requests');
  });

  it('nenhum data: em script, objeto ou padrão (MDN)', () => {
    for (const nome of ['script-src', 'object-src', 'default-src']) expect(csp[nome]).not.toContain('data:');
  });

  it('estilo: folhas com nonce; atributo style="" liberado (next/image) sem liberar <style> solto', () => {
    expect(csp['style-src']).toEqual(["'self'", "'nonce-abc123'"]);
    expect(csp['style-src-attr']).toEqual(["'unsafe-inline'"]);
  });

  it('origens externas só as que o site usa', () => {
    expect(csp['img-src']).toEqual(
      expect.arrayContaining(["'self'", 'data:', 'blob:', 'https://cms.adai.com.br', 'https://i.ytimg.com', 'https://storage.googleapis.com']),
    );
    expect(csp['connect-src']).toEqual(expect.arrayContaining(["'self'", 'https://*.google-analytics.com']));
    expect(csp['frame-src']).toEqual(["'self'", 'https://www.youtube-nocookie.com']);
  });

  it('anti-clickjacking: só o próprio site (vitrine) e o painel do Strapi (pré-visualização) podem emoldurar', () => {
    expect(csp['frame-ancestors']).toEqual(["'self'", 'https://cms.adai.com.br']);
  });

  it('relatório de violação pelos dois mecanismos (report-uri e report-to)', () => {
    expect(csp['report-uri']).toEqual([ROTA_RELATORIO_CSP]);
    expect(csp['report-to']).toEqual(['csp']);
  });

  it('desenvolvimento: unsafe-eval (depuração do React) e estilos inline (recarregamento), sem forçar https', () => {
    const dev = diretivas(montarCsp('abc123', LOCAL));
    expect(dev['script-src']).toContain("'unsafe-eval'");
    expect(dev['script-src']).not.toContain("'unsafe-inline'");
    expect(dev['style-src']).toEqual(["'self'", "'unsafe-inline'"]);
    expect(dev).not.toHaveProperty('upgrade-insecure-requests');
    expect(dev['frame-ancestors']).toEqual(["'self'", 'http://localhost:1337']);
  });

  it('é uma linha só (valor de cabeçalho HTTP)', () => {
    expect(montarCsp('abc123', PRODUCAO)).not.toMatch(/[\r\n]/);
  });
});

describe('cabecalhosDaPagina', () => {
  const pagina = (url: string, config = PRODUCAO) => cabecalhosDaPagina('abc123', config, new URL(url));

  it('CSP com o nonce + isolamento da janela (COOP) + endpoint de relatório', () => {
    const cabecalhos = pagina('https://adai.com.br/');
    expect(cabecalhos['Content-Security-Policy']).toContain("'nonce-abc123'");
    expect(cabecalhos['Content-Security-Policy-Report-Only']).toBeUndefined();
    expect(cabecalhos['Cross-Origin-Opener-Policy']).toBe('same-origin');
    expect(cabecalhos['Reporting-Endpoints']).toBe(`csp="https://adai.com.br${ROTA_RELATORIO_CSP}"`);
  });

  it('com ?gtm_debug (modo de visualização do GTM) libera a janela que abriu o site', () => {
    expect(pagina('https://adai.com.br/?gtm_debug=1700000000')['Cross-Origin-Opener-Policy']).toBe('unsafe-none');
  });

  it('CSP_SOMENTE_RELATORIO: só observa (implantação gradual recomendada pela MDN)', () => {
    const cabecalhos = pagina('https://adai.com.br/', { ...PRODUCAO, somenteRelatorio: true });
    expect(cabecalhos['Content-Security-Policy']).toBeUndefined();
    expect(cabecalhos['Content-Security-Policy-Report-Only']).toContain("'nonce-abc123'");
  });
});

describe('cabecalhosFixos (toda resposta)', () => {
  const fixos = cabecalhosFixos(PRODUCAO);

  it.each([
    ['Strict-Transport-Security', 'max-age=63072000; includeSubDomains'],
    ['X-Content-Type-Options', 'nosniff'],
    ['X-Frame-Options', 'SAMEORIGIN'],
    ['Referrer-Policy', 'strict-origin-when-cross-origin'],
    ['Cross-Origin-Resource-Policy', 'same-origin'],
    ['X-Permitted-Cross-Domain-Policies', 'none'],
    ['X-XSS-Protection', '0'],
  ])('%s: %s', (chave, valor) => {
    expect(valorDe(fixos, chave)).toBe(valor);
  });

  it('Permissions-Policy desliga o que o site não usa, sem bloquear o player do YouTube', () => {
    const politica = valorDe(fixos, 'Permissions-Policy')!;
    for (const recurso of ['camera', 'microphone', 'geolocation', 'payment', 'usb', 'browsing-topics']) expect(politica).toContain(`${recurso}=()`);
    for (const recurso of ['autoplay', 'fullscreen', 'encrypted-media', 'picture-in-picture', 'accelerometer', 'gyroscope']) expect(politica).not.toContain(recurso);
  });

  it('produção indexável: sem X-Robots-Tag', () => {
    expect(valorDe(fixos, 'X-Robots-Tag')).toBeUndefined();
  });

  it('local/homologação: sem HSTS (http) e fora do Google', () => {
    const local = cabecalhosFixos(LOCAL);
    expect(valorDe(local, 'Strict-Transport-Security')).toBeUndefined();
    expect(valorDe(local, 'X-Robots-Tag')).toBe('noindex, nofollow');
  });

  it('modo só-relatório não bloqueia moldura pelo X-Frame-Options (o frame-ancestors também só observa)', () => {
    expect(valorDe(cabecalhosFixos({ ...PRODUCAO, somenteRelatorio: true }), 'X-Frame-Options')).toBeUndefined();
  });

  it('nunca libera CORS', () => {
    expect(fixos.some((c) => c.key.toLowerCase().startsWith('access-control-'))).toBe(false);
  });
});

describe('cabecalhosDaApi (padrão Web API: só JSON, nada a renderizar)', () => {
  it('nada carrega, nada emoldura, nada vai para cache nem para o Google', () => {
    const api = cabecalhosDaApi();
    expect(valorDe(api, 'Content-Security-Policy')).toBe("default-src 'none'; frame-ancestors 'none'");
    expect(valorDe(api, 'Cache-Control')).toBe('no-store');
    expect(valorDe(api, 'X-Robots-Tag')).toBe('noindex, nofollow');
  });
});
