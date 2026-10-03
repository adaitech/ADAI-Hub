/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { unstable_doesMiddlewareMatch } from 'next/experimental/testing/server';
import { config, proxy } from './proxy';

const nonceDa = (csp: string | null) => /'nonce-([^']+)'/.exec(csp ?? '')?.[1];

describe('proxy (CSP com nonce por requisição)', () => {
  it('mesma CSP na resposta (navegador) e no pedido (o Next lê o nonce e o aplica nos próprios scripts)', () => {
    const resposta = proxy(new NextRequest('http://localhost:3000/'));
    const csp = resposta.headers.get('Content-Security-Policy');
    const nonce = nonceDa(csp);

    expect(nonce).toBeTruthy();
    expect(resposta.headers.get('x-middleware-request-content-security-policy')).toBe(csp);
    expect(resposta.headers.get('x-middleware-request-x-nonce')).toBe(nonce);
    expect(resposta.headers.get('Cross-Origin-Opener-Policy')).toBe('same-origin');
    expect(resposta.headers.get('Reporting-Endpoints')).toMatch(/^csp="https?:\/\/[^"]+\/api\/csp-report"$/);
  });

  it('nonce novo a cada requisição', () => {
    const a = nonceDa(proxy(new NextRequest('http://localhost:3000/')).headers.get('Content-Security-Policy'));
    const b = nonceDa(proxy(new NextRequest('http://localhost:3000/')).headers.get('Content-Security-Policy'));
    expect(a).not.toBe(b);
  });

  it('ignora um x-nonce mandado pelo visitante (o nonce é sempre do servidor)', () => {
    const resposta = proxy(new NextRequest('http://localhost:3000/', { headers: { 'x-nonce': 'atacante' } }));
    expect(resposta.headers.get('x-middleware-request-x-nonce')).not.toBe('atacante');
  });

  it('modo de visualização do GTM: libera a janela que abriu o site', () => {
    expect(proxy(new NextRequest('http://localhost:3000/?gtm_debug=1')).headers.get('Cross-Origin-Opener-Policy')).toBe('unsafe-none');
  });

  describe('roda nas páginas, não em arquivos estáticos, API nem prefetch', () => {
    const roda = (url: string, headers?: Record<string, string>) => unstable_doesMiddlewareMatch({ config, url, headers });

    it.each(['/', '/politica-de-privacidade', '/componentes/hero-section', '/componentes/preview/hero-section'])('roda em %s', (url) => {
      expect(roda(url)).toBe(true);
    });

    it.each(['/_next/static/chunks/app.js', '/_next/image?url=x', '/api/revalidate', '/api/csp-report', '/favicon.ico', '/robots.txt', '/sitemap.xml'])(
      'não roda em %s',
      (url) => {
        expect(roda(url)).toBe(false);
      },
    );

    it('não roda no prefetch do next/link', () => {
      expect(roda('/', { 'next-router-prefetch': '1' })).toBe(false);
    });
  });
});
