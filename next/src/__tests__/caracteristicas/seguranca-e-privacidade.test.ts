/**
 * Característica: segredos nunca chegam ao navegador nem ao Git, e o que roda no navegador não
 * importa código de servidor. Varre o código-fonte — vale para arquivo novo sem editar o teste.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const next = process.cwd();
const raiz = join(next, '..');

function arquivos(pasta: string, filtro: RegExp): string[] {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);
    if (statSync(caminho).isDirectory()) return ['node_modules', '.next', 'generated'].includes(nome) ? [] : arquivos(caminho, filtro);
    return filtro.test(nome) ? [caminho] : [];
  });
}

const codigo = arquivos(join(next, 'src'), /\.(ts|tsx)$/).filter((a) => !/\.test\.tsx?$/.test(a) && !a.includes('test-utils'));
const ler = (caminho: string) => readFileSync(caminho, 'utf8');
const rel = (caminho: string) => relative(raiz, caminho).replace(/\\/g, '/');
const ehCliente = (fonte: string) => /^\s*['"]use client['"]/.test(fonte);
const SEGREDO = /(KEY|SECRET|TOKEN|PASSWORD|SENHA|SALT)/;

describe('segredos', () => {
  it('nenhuma variável NEXT_PUBLIC_ com cara de segredo (NEXT_PUBLIC_ vai para o navegador)', () => {
    const usos = codigo.flatMap((a) => [...ler(a).matchAll(/NEXT_PUBLIC_[A-Z0-9_]+/g)].map((m) => `${rel(a)}: ${m[0]}`));
    const exemplos = ['next/.env.example', 'strapi/.env.example'].flatMap((a) =>
      [...ler(join(raiz, a)).matchAll(/^\s*#?\s*(NEXT_PUBLIC_[A-Z0-9_]+)=/gm)].map((m) => `${a}: ${m[1]}`),
    );
    expect([...usos, ...exemplos].filter((uso) => SEGREDO.test(uso.split(': ')[1]))).toEqual([]);
  });

  it.each(['next/.env.example', 'strapi/.env.example'])('%s não contém segredo real (vazio ou "tobemodified")', (arquivo) => {
    const linhas = ler(join(raiz, arquivo))
      .split(/\r?\n/)
      .map((l) => /^\s*([A-Z0-9_]+)=(.*)$/.exec(l))
      .filter((m): m is RegExpExecArray => Boolean(m && SEGREDO.test(m[1])));
    for (const [, nome, valor] of linhas) {
      const itens = valor.replace(/^"|"$/g, '').split(',').map((v) => v.trim());
      expect({ nome, ok: itens.every((v) => v === '' || /^tobemodified\d*$/i.test(v)) }).toEqual({ nome, ok: true });
    }
  });

  it('chave de API vai no header, nunca na URL (URL aparece em log e no histórico)', () => {
    expect(codigo.filter((a) => /[?&](key|api_key|apikey|token|secret)=/i.test(ler(a))).map(rel)).toEqual([]);
  });

  it('nenhum log imprime variável de ambiente de segredo', () => {
    const vazamentos = codigo.filter((a) =>
      ler(a)
        .split('\n')
        .some((linha) => /console\.\w+\(/.test(linha) && /process\.env\.[A-Z0-9_]*(KEY|SECRET|TOKEN)/.test(linha)),
    );
    expect(vazamentos.map(rel)).toEqual([]);
  });
});

describe('fronteira servidor × navegador', () => {
  const SO_SERVIDOR = [
    'next/headers',
    '@/lib/strapi/client',
    '@/lib/strapi/queries',
    '@/lib/youtube/client',
    '@/lib/youtube/serie-atual',
    '@/lib/inchurch/client',
    '@/lib/inchurch/eventos-cache',
  ];

  it('Client Components ("use client") não importam código de servidor nem leem process.env de segredo', () => {
    const problemas = codigo
      .filter((a) => ehCliente(ler(a)))
      .flatMap((a) => {
        const fonte = ler(a);
        const importsServidor = SO_SERVIDOR.filter((modulo) => new RegExp(`from ['"]${modulo.replace(/[/@]/g, '\\$&')}(/[^'"]*)?['"]`).test(fonte));
        const env = [...fonte.matchAll(/process\.env\.([A-Z0-9_]+)/g)].map((m) => m[1]).filter((v) => !v.startsWith('NEXT_PUBLIC_') && v !== 'NODE_ENV');
        return [...importsServidor.map((m) => `${rel(a)} importa ${m}`), ...env.map((v) => `${rel(a)} lê process.env.${v}`)];
      });
    expect(problemas).toEqual([]);
  });

  it('dangerouslySetInnerHTML só no snippet oficial do GTM (conteúdo gerado pelo código, nunca do CMS)', () => {
    expect(codigo.filter((a) => ler(a).includes('dangerouslySetInnerHTML')).map(rel)).toEqual(['next/src/components/analytics/GoogleTagManager.tsx']);
  });
});

describe('documentação', () => {
  const mds = [
    ...arquivos(join(raiz, 'docs'), /\.md$/),
    ...arquivos(join(raiz, '.agents'), /\.md$/),
    join(raiz, 'AGENTS.md'),
    join(raiz, 'README.md'),
  ];

  it('links relativos dos MDs apontam para arquivos que existem', () => {
    const quebrados = mds.flatMap((md) =>
      [...ler(md).matchAll(/\]\((?!https?:|mailto:|#)([^)\s#]+)/g)]
        .map((m) => m[1])
        .filter((alvo) => {
          try {
            statSync(join(md, '..', decodeURIComponent(alvo)));
            return false;
          } catch {
            return true;
          }
        })
        .map((alvo) => `${rel(md)} → ${alvo}`),
    );
    expect(quebrados).toEqual([]);
  });
});
