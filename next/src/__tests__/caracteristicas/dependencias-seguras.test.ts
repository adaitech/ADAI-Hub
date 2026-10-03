/**
 * Característica: nenhuma dependência de produção abaixo da versão que corrigiu uma
 * vulnerabilidade conhecida. Impede que um downgrade (ou um `yarn add` desatento) traga de volta
 * uma falha já corrigida. Diagnóstico e motivos: `docs/seguranca/README.md`.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const raiz = join(process.cwd(), '..');
type Pacote = { dependencies: Record<string, string> };
const deps = (app: 'next' | 'strapi') => (JSON.parse(readFileSync(join(raiz, app, 'package.json'), 'utf8')) as Pacote).dependencies;

/** Versão base de uma faixa do package.json (`^16.3.8` → `16.3.8`). */
const base = (faixa: string) => faixa.replace(/^[\^~]/, '');

/** `a < b` comparando major.minor.patch numericamente. */
export function menorQue(a: string, b: string): boolean {
  const [x, y] = [a, b].map((v) => base(v).split('.').map(Number));
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] < y[i];
  return false;
}

describe('versões mínimas seguras', () => {
  it('Strapi ≥ 5.37.0 (vazamento por filtro relacional e SQL injection corrigidos)', () => {
    const strapi = deps('strapi');
    expect(menorQue(strapi['@strapi/strapi'], '5.37.0')).toBe(false);
    expect(strapi['@strapi/plugin-users-permissions']).toBe(strapi['@strapi/strapi']);
  });

  it('plugin de SEO fixo em 2.x (a ferramenta de upgrade não pode trocá-lo por 5.x)', () => {
    expect(deps('strapi')['@strapi/plugin-seo']).toMatch(/^2\.\d+\.\d+$/);
  });

  it('Next ≥ 16.3.8', () => {
    expect(menorQue(deps('next').next, '16.3.8')).toBe(false);
  });

  it('sharp ≥ 0.35.4 (libvips/libheif)', () => {
    expect(menorQue(deps('next').sharp, '0.35.4')).toBe(false);
  });
});

describe('menorQue', () => {
  it('compara numericamente, não como texto, e aceita faixas ^/~', () => {
    expect(menorQue('5.9.0', '5.37.0')).toBe(true);
    expect(menorQue('^16.3.10', '16.3.8')).toBe(false);
    expect(menorQue('~0.35.4', '0.35.4')).toBe(false);
  });
});
