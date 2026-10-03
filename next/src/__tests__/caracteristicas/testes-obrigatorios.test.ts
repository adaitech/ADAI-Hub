/**
 * Característica: **nenhum código sem teste** (regra de Pull Request — `.agents/rules/Testes.md`).
 * Componente, módulo de `lib/` ou rota nova sem teste faz o `yarn test` falhar, antes do PR.
 *
 * Exceção só com justificativa: arquivo coberto por um teste de outro lugar entra em
 * `COBERTO_POR`, apontando o teste que o exercita (o teste confere que ele existe e o importa).
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';

const src = join(process.cwd(), 'src');
const rel = (caminho: string) => relative(src, caminho).replace(/\\/g, '/');

function arquivos(pasta: string): string[] {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);
    return statSync(caminho).isDirectory() ? (['__fixtures__', 'generated'].includes(nome) ? [] : arquivos(caminho)) : [caminho];
  });
}

const todos = arquivos(src);
const testes = todos.filter((a) => /\.test\.tsx?$/.test(a));
const conteudoTestes = testes.map((t) => ({ teste: rel(t), fonte: readFileSync(t, 'utf8') }));

/** Arquivos exercitados por um teste de integração/característica, com o motivo. */
const COBERTO_POR: Record<string, { teste: string; motivo: string }> = {
  'lib/strapi/queries/page.ts': { teste: '__tests__/integracao/paginas.test.tsx', motivo: 'query testada com a página real (populate, tags, draft)' },
  'lib/strapi/queries/global.ts': { teste: '__tests__/integracao/paginas.test.tsx', motivo: 'Configurações do site, inclusive 404' },
  'lib/showcase/catalog.ts': { teste: 'lib/showcase/catalog.test.tsx', motivo: 'teste com extensão .tsx' },
};

/** Só tipos, dados ou configuração: nada a executar. */
const SEM_COMPORTAMENTO = /(^|\/)(types|index)\.ts$|\.mock\.json$|\.module\.css$|\.showcase\.tsx$|^app\/fonts\.ts$|^test-utils\//;

describe('todo módulo tem teste', () => {
  const modulos = todos.filter((a) => /\.(ts|tsx)$/.test(a) && !/\.test\.tsx?$/.test(a) && !SEM_COMPORTAMENTO.test(rel(a)) && !/\.d\.ts$/.test(a));

  it.each(modulos.filter((a) => rel(a).startsWith('lib/') || rel(a).startsWith('utils/')).map(rel))('%s', (modulo) => {
    const base = join(src, modulo).replace(/\.tsx?$/, '');
    if (existsSync(`${base}.test.ts`) || existsSync(`${base}.test.tsx`)) return;
    const cobertura = COBERTO_POR[modulo];
    expect(cobertura).toBeDefined();
    const teste = conteudoTestes.find((t) => t.teste === cobertura.teste);
    expect(teste).toBeDefined();
  });
});

describe('todo componente tem teste', () => {
  const pastas = [...new Set(todos.filter((a) => a.endsWith('.tsx') && rel(a).startsWith('components/') && !/\.(test|showcase)\.tsx$/.test(a)).map(dirname))];

  it.each(pastas.map(rel))('%s', (pasta) => {
    const temTeste = testes.some((t) => dirname(t) === join(src, pasta));
    expect({ pasta, temTeste }).toEqual({ pasta, temTeste: true });
  });
});

describe('toda rota do app tem teste', () => {
  const rotas = todos.filter((a) => rel(a).startsWith('app/') && /^(page|layout|route|error|not-found|sitemap|robots)\.tsx?$/.test(basename(a)));

  it.each(rotas.map(rel))('%s', (rota) => {
    const importacao = `@/${rota.replace(/\.tsx?$/, '')}`;
    const relativa = `./${rota.replace(/^app\//, '').replace(/\.tsx?$/, '')}`;
    const testada = conteudoTestes.some(({ teste, fonte }) => fonte.includes(`'${importacao}'`) || (teste.startsWith('app/') && fonte.includes(`'${relativa}'`)));
    expect({ rota, testada }).toEqual({ rota, testada: true });
  });
});
