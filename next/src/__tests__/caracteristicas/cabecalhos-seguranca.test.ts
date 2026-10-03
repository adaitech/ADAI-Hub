/**
 * @jest-environment node
 *
 * Característica: o padrão de cabeçalhos de segurança vale para **toda** resposta do site e o CORS
 * fica fechado nos dois apps. Falha se alguém tirar um cabeçalho, abrir o CORS ou religar o
 * X-Powered-By. Padrão e fontes: `docs/seguranca/README.md` → "Cabeçalhos, CSP e CORS".
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { unstable_getResponseFromNextConfig } from 'next/experimental/testing/server';
import nextConfig from '../../../next.config';

const resposta = (url: string, headers?: Record<string, string>) => unstable_getResponseFromNextConfig({ url, nextConfig, headers });

const OBRIGATORIOS = ['X-Content-Type-Options', 'X-Frame-Options', 'Referrer-Policy', 'Permissions-Policy', 'Cross-Origin-Resource-Policy', 'X-XSS-Protection'];

describe('site (next.config.ts)', () => {
  it('não anuncia a tecnologia (X-Powered-By)', () => {
    expect(nextConfig.poweredByHeader).toBe(false);
  });

  it.each(['http://localhost:3000/', 'http://localhost:3000/eventos', 'http://localhost:3000/_next/static/chunks/app.js', 'http://localhost:3000/api/revalidate'])(
    'cabeçalhos fixos em %s',
    async (url) => {
      const { headers } = await resposta(url);
      for (const nome of OBRIGATORIOS) expect({ nome, valor: headers.get(nome) }).toEqual({ nome, valor: expect.any(String) });
      expect(headers.get('X-Content-Type-Options')).toBe('nosniff');
    },
  );

  it('API segue o padrão Web API (nada a renderizar nem guardar em cache)', async () => {
    const { headers } = await resposta('http://localhost:3000/api/csp-report');
    expect(headers.get('Content-Security-Policy')).toBe("default-src 'none'; frame-ancestors 'none'");
    expect(headers.get('Cache-Control')).toBe('no-store');
  });

  it('nenhuma resposta libera CORS, nem para uma origem estranha', async () => {
    for (const url of ['http://localhost:3000/', 'http://localhost:3000/api/revalidate', 'http://localhost:3000/api/preview']) {
      const { headers } = await resposta(url, { origin: 'https://malicioso.example' });
      expect([...headers.keys()].filter((nome) => nome.startsWith('access-control-'))).toEqual([]);
    }
  });
});

describe('Strapi (strapi/config/middlewares.ts)', () => {
  const middlewares = readFileSync(join(process.cwd(), '..', 'strapi', 'config', 'middlewares.ts'), 'utf8');

  it('sem X-Powered-By', () => {
    expect(middlewares).not.toMatch(/['"]strapi::poweredBy['"]/);
  });

  it('CORS só com as origens da lista, sem cookies de outra origem', () => {
    expect(middlewares).toMatch(/name:\s*['"]strapi::cors['"]/);
    expect(middlewares).toMatch(/CORS_ORIGINS/);
    expect(middlewares).toMatch(/credentials:\s*false/);
    expect(middlewares).not.toMatch(/origin:\s*['"]\*['"]/);
  });

  it('Permissions-Policy também no CMS', () => {
    expect(middlewares).toMatch(/['"]global::permissions-policy['"]/);
  });
});
