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

/**
 * major.minor.patch de uma versão exata ou faixa `^`/`~`. Qualquer outra forma (`>=`, `latest`,
 * `*`, `workspace:`, pré-versão…) lança erro: o teste falha em vez de dar "seguro" por engano.
 */
function partes(faixa: string): number[] {
  const m = /^[\^~]?(\d+)\.(\d+)\.(\d+)$/.exec(faixa.trim());
  if (!m) throw new Error(`Versão "${faixa}": não dá para garantir o piso de segurança; use x.y.z, ^x.y.z ou ~x.y.z`);
  return m.slice(1).map(Number);
}

/** `a < b` comparando major.minor.patch numericamente. */
export function menorQue(a: string, b: string): boolean {
  const [x, y] = [a, b].map(partes);
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

  it.each(['>=5.0.0', 'latest', '*', '^5', '=5.17.0', 'v5.17.0', 'workspace:*', 'npm:@strapi/strapi@5.17.0', '5.37.0-beta.1'])(
    'versão que não dá para garantir (%p) → erro, nunca "seguro" por engano',
    (faixa) => {
      expect(() => menorQue(faixa, '5.37.0')).toThrow(/não dá para garantir/);
    },
  );
});

describe('ninguém contorna o piso', () => {
  type ComResolutions = { resolutions?: Record<string, string> };
  const resolutions = (app: 'next' | 'strapi') =>
    Object.keys((JSON.parse(readFileSync(join(raiz, app, 'package.json'), 'utf8')) as ComResolutions).resolutions ?? {});

  it('resolutions não podem forçar os pacotes vigiados (o package.json deixaria de valer)', () => {
    const vigiados = ['next', 'sharp', '@strapi/strapi', '@strapi/plugin-users-permissions', '@strapi/plugin-seo'];
    expect([...resolutions('next'), ...resolutions('strapi')].filter((p) => vigiados.some((v) => p === v || p.endsWith(`/${v}`)))).toEqual([]);
  });

  it('a versão de fato instalada (yarn.lock) também respeita o piso', () => {
    const instaladas = (app: 'next' | 'strapi', pacote: string) => {
      const lock = readFileSync(join(raiz, app, 'yarn.lock'), 'utf8');
      const cabecalho = new RegExp(`^"?${pacote.replace(/[/@]/g, '\\$&')}@[^\\n]*:\\r?\\n\\s+version "([^"]+)"`, 'gm');
      return [...lock.matchAll(cabecalho)].map((m) => m[1]);
    };
    const pisos: [app: 'next' | 'strapi', pacote: string, piso: string][] = [
      ['next', 'next', '16.3.8'],
      ['next', 'sharp', '0.35.4'],
      ['strapi', '@strapi/strapi', '5.37.0'],
      ['strapi', '@strapi/plugin-users-permissions', '5.37.0'],
    ];
    for (const [app, pacote, piso] of pisos) {
      const versoes = instaladas(app, pacote);
      expect({ pacote, achou: versoes.length > 0 }).toEqual({ pacote, achou: true });
      for (const versao of versoes) expect({ pacote, versao, abaixoDoPiso: menorQue(versao, piso) }).toEqual({ pacote, versao, abaixoDoPiso: false });
    }
  });
});
