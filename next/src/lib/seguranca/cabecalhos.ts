/**
 * Padrão de cabeçalhos HTTP de segurança do site (CSP, transporte, clickjacking, CORS...).
 * Fonte única: usado pelo `proxy.ts` (CSP com nonce, por requisição) e pelo `next.config.ts`
 * (cabeçalhos fixos). Decisões e fontes: `docs/seguranca/README.md` → "Cabeçalhos, CSP e CORS".
 *
 * Sem imports com `@/`: o `next.config.ts` importa este arquivo por caminho relativo.
 */

export interface ConfigSeguranca {
  /** `next dev`: libera o que o React/recarregamento precisam (`unsafe-eval`, estilos inline). */
  dev: boolean;
  /** Origem pública do site (endpoint de relatório; https liga HSTS e upgrade-insecure-requests). */
  siteUrl: string;
  /** Origem do Strapi (imagens e painel de pré-visualização, que emoldura o site). */
  strapiUrl: string;
  /** Produção liberada para o Google (`SITE_INDEXAVEL=true`). */
  indexavel: boolean;
  /** `CSP_SOMENTE_RELATORIO=true`: a CSP só observa e relata (implantação gradual). */
  somenteRelatorio: boolean;
}

interface Cabecalho {
  key: string;
  value: string;
}

export const ROTA_RELATORIO_CSP = '/api/csp-report';
const GRUPO_RELATORIO = 'csp';

const GOOGLE_ANALYTICS = ['https://*.google-analytics.com', 'https://*.analytics.google.com', 'https://*.googletagmanager.com'];

/** Recursos do navegador que o site não usa. Autoplay, fullscreen etc. ficam livres para o player do YouTube. */
const PERMISSOES_DESLIGADAS = ['camera', 'microphone', 'geolocation', 'payment', 'usb', 'serial', 'hid', 'midi', 'display-capture', 'browsing-topics'];

function origem(valor: string | undefined, reserva: string): string {
  try {
    return new URL(valor ?? reserva).origin;
  } catch {
    return reserva;
  }
}

export function lerConfigSeguranca(env: NodeJS.ProcessEnv = process.env): ConfigSeguranca {
  return {
    dev: env.NODE_ENV === 'development',
    siteUrl: origem(env.NEXT_PUBLIC_SITE_URL, 'http://localhost:3000'),
    strapiUrl: origem(env.NEXT_PUBLIC_STRAPI_URL, 'http://localhost:1337'),
    indexavel: env.SITE_INDEXAVEL === 'true',
    somenteRelatorio: env.CSP_SOMENTE_RELATORIO === 'true',
  };
}

const ehHttps = (config: ConfigSeguranca) => config.siteUrl.startsWith('https://');

/** 128 bits aleatórios em base64, novo a cada requisição (Web Crypto: roda no proxy e no Jest). */
export function gerarNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes));
}

export function montarCsp(nonce: string, config: ConfigSeguranca): string {
  const diretivas: Record<string, string[]> = {
    'default-src': ["'self'"],
    // strict-dynamic: o que o script com nonce carregar (GTM → GA4) também roda. O host fica de reserva
    // para navegador sem CSP3 (os atuais o ignoram quando há strict-dynamic).
    'script-src': ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", 'https://www.googletagmanager.com', ...(config.dev ? ["'unsafe-eval'"] : [])],
    'style-src': config.dev ? ["'self'", "'unsafe-inline'"] : ["'self'", `'nonce-${nonce}'`],
    // Atributo style="" (next/image, vitrine). Não executa código; <style> solto continua exigindo nonce.
    'style-src-attr': ["'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:', config.strapiUrl, 'https://i.ytimg.com', 'https://storage.googleapis.com', ...GOOGLE_ANALYTICS],
    'font-src': ["'self'"],
    'connect-src': ["'self'", ...GOOGLE_ANALYTICS],
    'frame-src': ["'self'", 'https://www.youtube-nocookie.com'],
    'frame-ancestors': ["'self'", config.strapiUrl],
    'object-src': ["'none'"],
    'base-uri': ["'none'"],
    'form-action': ["'self'"],
    ...(ehHttps(config) ? { 'upgrade-insecure-requests': [] } : {}),
    'report-uri': [ROTA_RELATORIO_CSP],
    'report-to': [GRUPO_RELATORIO],
  };

  return Object.entries(diretivas)
    .map(([nome, valores]) => [nome, ...valores].join(' '))
    .join('; ');
}

/** Cabeçalhos que dependem da requisição (nonce, URL): aplicados pelo `proxy.ts` nas páginas. */
export function cabecalhosDaPagina(nonce: string, config: ConfigSeguranca, url: URL): Record<string, string> {
  const nomeCsp = config.somenteRelatorio ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy';
  return {
    [nomeCsp]: montarCsp(nonce, config),
    'Reporting-Endpoints': `${GRUPO_RELATORIO}="${config.siteUrl}${ROTA_RELATORIO_CSP}"`,
    // O Tag Assistant do GTM abre o site numa janela e conversa com ela: isolar a janela o desconecta.
    'Cross-Origin-Opener-Policy': url.searchParams.has('gtm_debug') ? 'unsafe-none' : 'same-origin',
  };
}

/** Cabeçalhos iguais em toda resposta (páginas, `_next/static`, imagens, API): `next.config.ts`. */
export function cabecalhosFixos(config: ConfigSeguranca): Cabecalho[] {
  return [
    ...(ehHttps(config) ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' }] : []),
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    // Reserva para navegador antigo (os atuais seguem o frame-ancestors). No modo só-relatório ele
    // bloquearia a pré-visualização do Strapi sozinho, então fica de fora.
    ...(config.somenteRelatorio ? [] : [{ key: 'X-Frame-Options', value: 'SAMEORIGIN' }]),
    // Não "no-referrer": o player do YouTube exige o referrer (erro 153 sem ele).
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: PERMISSOES_DESLIGADAS.map((recurso) => `${recurso}=()`).join(', ') },
    { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
    { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
    // Filtro antigo do navegador: obsoleto e fonte de vazamento (MDN/OWASP). 0 = desligado.
    { key: 'X-XSS-Protection', value: '0' },
    ...(config.indexavel ? [] : [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]),
  ];
}

/** Rotas `/api/*`: só JSON/redirecionamento, nada a renderizar nem a guardar em cache. */
export function cabecalhosDaApi(): Cabecalho[] {
  return [
    { key: 'Content-Security-Policy', value: "default-src 'none'; frame-ancestors 'none'" },
    { key: 'Cache-Control', value: 'no-store' },
    { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
  ];
}
