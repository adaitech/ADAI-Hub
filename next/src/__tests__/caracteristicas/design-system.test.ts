/**
 * Característica: design system do Figma (spec docs/superpowers/specs/2026-10-18-design-system-figma-design.md).
 * `tokens.css` é a fonte executável; os HTMLs autocontidos e o Markdown repetem os mesmos tokens.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const src = join(process.cwd(), 'src');

/** Custom properties do primeiro bloco `:root`, com valor normalizado (espaços colapsados, hex minúsculo). */
export function lerTokens(css: string): Map<string, string> {
  const semComentarios = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const bloco = semComentarios.match(/:root\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
  return new Map(
    [...bloco.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(([, nome, valor]) => [
      nome,
      valor.trim().replace(/\s+/g, ' ').replace(/#[0-9a-f]{3,8}\b/gi, (hex) => hex.toLowerCase()),
    ]),
  );
}

/** Segue `var(--x)` até um valor literal. */
export function resolver(tokens: Map<string, string>, nome: string): string {
  const valor = tokens.get(nome);
  if (valor === undefined) throw new Error(`token inexistente: ${nome}`);
  const alias = valor.match(/^var\((--[\w-]+)\)$/);
  return alias ? resolver(tokens, alias[1]) : valor;
}

function luminancia(hex: string): number {
  const h = hex.replace('#', '');
  const cheio = h.length === 3 ? [...h].map((c) => c + c).join('') : h;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(cheio.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Razão de contraste WCAG 2.2 entre duas cores hex. */
export function contraste(hexA: string, hexB: string): number {
  const [claro, escuro] = [luminancia(hexA), luminancia(hexB)].sort((a, b) => b - a);
  return (claro + 0.05) / (escuro + 0.05);
}

/** Tokens canônicos do plano (sem aliases de migração). */
export const TOKENS_CANONICOS = [
  '--black', '--white', '--gray-100', '--gray-200', '--gray-500', '--gray-600', '--gray-900',
  '--color-bg-page', '--color-bg-subtle', '--color-bg-subtle-2', '--color-bg-inverse',
  '--color-text-primary', '--color-text-muted', '--color-text-inverse',
  '--font-size-display', '--font-size-h1', '--font-size-h2', '--font-size-h3', '--font-size-h4',
  '--font-size-numero', '--font-size-marca', '--font-size-corpo', '--font-size-corpo-pequeno',
  '--font-size-legenda', '--font-size-micro', '--font-size-botao', '--font-size-link-menu',
  '--line-height-display', '--letter-spacing-display', '--line-height-h1', '--letter-spacing-h1',
  '--line-height-h2', '--letter-spacing-h2', '--line-height-h3', '--letter-spacing-h3',
  '--line-height-h4', '--letter-spacing-h4', '--line-height-numero', '--letter-spacing-numero',
  '--line-height-marca', '--letter-spacing-marca', '--line-height-legenda',
  '--radius-sm', '--radius-md', '--radius-lg', '--radius-pill',
  '--space-section', '--content-max', '--space-page-margin', '--container-max',
];

const tokens = lerTokens(readFileSync(join(src, 'styles/tokens.css'), 'utf8'));

describe('tokens canônicos', () => {
  it.each([
    ['--radius-sm', '14px'],
    ['--space-section', 'clamp(64px, 8.333vw, 120px)'],
    ['--content-max', '80rem'],
    ['--space-page-margin', 'clamp(16px, 5.556vw, 80px)'],
    ['--font-size-h1', 'clamp(2.5rem, 5.417vw, 4.875rem)'],
    ['--font-size-h2', 'clamp(2rem, 3.333vw, 3rem)'],
    ['--font-size-display', 'clamp(48px, 9.03vw, 130px)'],
    ['--gray-200', '#e8e8e8'],
  ])('%s = %s', (nome, valor) => {
    expect(tokens.get(nome)).toBe(valor);
  });

  it('todo token canônico existe', () => {
    expect(TOKENS_CANONICOS.filter((t) => !tokens.has(t))).toEqual([]);
  });

  it('aliases de migração apontam para o canônico', () => {
    expect(tokens.get('--font-size-mega')).toBe('var(--font-size-marca)');
    expect(tokens.get('--font-size-lead')).toBe('var(--font-size-corpo)');
    expect(tokens.get('--font-size-chamada')).toBe('var(--font-size-h1)');
  });

  it.each([
    ['--color-text-muted', '--color-bg-page'],
    ['--color-text-muted', '--color-bg-subtle'],
    ['--color-text-primary', '--color-bg-subtle-2'],
    ['--color-text-inverse', '--color-bg-inverse'],
  ])('contraste AA: %s sobre %s', (texto, fundo) => {
    expect(contraste(resolver(tokens, texto), resolver(tokens, fundo))).toBeGreaterThanOrEqual(4.5);
  });

  it('par proibido documentado: texto suave sobre superfície 2 falha AA', () => {
    expect(contraste(resolver(tokens, '--color-text-muted'), resolver(tokens, '--color-bg-subtle-2'))).toBeLessThan(4.5);
  });
});

function arquivosModulo(pasta: string): string[] {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);
    return statSync(caminho).isDirectory() ? arquivosModulo(caminho) : nome.endsWith('.module.css') ? [caminho] : [];
  });
}

const modulos = arquivosModulo(src).map((caminho) => ({
  arquivo: relative(src, caminho).replace(/\\/g, '/'),
  fonte: readFileSync(caminho, 'utf8').replace(/\/\*[\s\S]*?\*\//g, ''),
}));

describe('migração para os tokens canônicos', () => {
  it('nenhum módulo usa aliases de migração de marca e chamada', () => {
    const ALIASES = ['--font-size-mega', '--line-height-mega', '--letter-spacing-mega', '--font-size-chamada', '--line-height-chamada', '--letter-spacing-chamada'];
    const problemas = modulos.flatMap(({ arquivo, fonte }) => ALIASES.filter((a) => fonte.includes(`var(${a})`)).map((a) => `${arquivo}: ${a}`));
    expect(problemas).toEqual([]);
  });

  it('títulos de seção usam H1: nenhum módulo usa a tripla de H2 antiga (72px → agora H1)', () => {
    // O Figma usa H1 (78, linha 74) nos títulos de seção. Regra com --font-size-h2 só pode existir se
    // for H2 de verdade (48); até haver consumidor assim, nenhum módulo usa --font-size-h2.
    const problemas = modulos.filter(({ fonte }) => fonte.includes('var(--font-size-h2)')).map(({ arquivo }) => arquivo);
    expect(problemas).toEqual([]);
  });

  it('nenhuma regra mistura tokens de H1 e H2', () => {
    const problemas = modulos.flatMap(({ arquivo, fonte }) =>
      [...fonte.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
        .filter(([, , corpo]) => /-h1\)/.test(corpo) && /-h2\)/.test(corpo))
        .map(([, seletor]) => `${arquivo}: ${seletor.trim()}`),
    );
    expect(problemas).toEqual([]);
  });
});

const raiz = join(process.cwd(), '..');

export const PRANCHAS = ['1:3', '4:270', '220:18960', '220:19032', '220:19107', '220:19183', '220:19253', '220:19333', '220:19389', '220:19607', '220:19491', '253:1255', '255:1357', '256:1459', '257:1560'];
export const COMPONENTES = ['244:1256', '233:21', '233:48', '233:106', '237:1253', '237:1246', '237:1249', '237:1252', '234:998', '237:1199', '238:1236', '234:1010'];

function ler(caminhoRelativo: string): string {
  const caminho = join(raiz, caminhoRelativo);
  return existsSync(caminho) ? readFileSync(caminho, 'utf8') : '';
}

function primeiroStyle(html: string): string {
  return html.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? '';
}

describe.each(['docs/design-system.html', 'templates/adai-page-template.html'])('%s', (arquivo) => {
  const html = ler(arquivo);

  it('existe', () => {
    expect(html.length).toBeGreaterThan(0);
  });

  it('tem lang pt-BR, viewport e um único h1', () => {
    expect(html).toMatch(/<html lang="pt-BR">/);
    expect(html).toMatch(/<meta name="viewport" content="width=device-width, initial-scale=1">/);
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
  });

  it('todo input/select/textarea tem <label for> correspondente', () => {
    const ids = [...html.matchAll(/<(?:input|select|textarea)\b[^>]*\bid="([^"]+)"/g)].map((m) => m[1]);
    const rotulados = new Set([...html.matchAll(/<label[^>]*\bfor="([^"]+)"/g)].map((m) => m[1]));
    const envolvidos = [...html.matchAll(/<label[^>]*>(?:(?!<\/label>)[\s\S])*?<input\b[^>]*\bid="([^"]+)"/g)].map((m) => m[1]);
    expect(ids.filter((id) => !rotulados.has(id) && !envolvidos.includes(id))).toEqual([]);
  });

  it('sem dependência de rede nem fonte proprietária', () => {
    expect(html).not.toMatch(/<(script|link|img)[^>]+(src|href)="https?:/i);
    expect(html).not.toMatch(/@import|url\(\s*['"]?https?:|@font-face|\.woff2?\b|\.otf\b|\.ttf\b/i);
  });

  it('todo src/href local aponta para arquivo existente', () => {
    const locais = [...html.matchAll(/\b(?:src|href)="([^"]+)"/g)]
      .map((m) => m[1])
      .filter((url) => !/^(#|\/|mailto:|tel:|https?:)/.test(url));
    const base = join(raiz, arquivo, '..');
    expect(locais.filter((url) => !existsSync(join(base, url)))).toEqual([]);
  });

  it('sem placeholder: nada de TODO, TBD, lorem ipsum', () => {
    // TODO/TBD só em caixa alta: "todo domingo" é português, não pendência.
    expect(html).not.toMatch(/\bTODO\b|\bTBD\b/);
    expect(html).not.toMatch(/lorem ipsum/i);
  });

  it('tokens compartilhados iguais aos de tokens.css', () => {
    const doHtml = lerTokens(primeiroStyle(html));
    expect([...doHtml].filter(([nome, valor]) => tokens.has(nome) && tokens.get(nome) !== valor)).toEqual([]);
    expect(TOKENS_CANONICOS.filter((t) => !doHtml.has(t))).toEqual([]);
  });
});

describe('docs/design-system.html — inventário', () => {
  const html = ler('docs/design-system.html');

  it('cita as 15 pranchas e os 12 componentes', () => {
    expect([...PRANCHAS, ...COMPONENTES].filter((id) => !html.includes(id))).toEqual([]);
  });

  it('tem as marcações Observado, Derivado e Proposto', () => {
    expect(['Observado', 'Derivado', 'Proposto'].filter((m) => !html.includes(m))).toEqual([]);
  });
});

describe('docs/design-system.md', () => {
  const md = ler('docs/design-system.md');

  it('cita as 15 pranchas e os 12 componentes', () => {
    expect(md.length).toBeGreaterThan(0);
    expect([...PRANCHAS, ...COMPONENTES].filter((id) => !md.includes(id))).toEqual([]);
  });

  it('cita todos os tokens canônicos com o mesmo valor de tokens.css', () => {
    const linhas = md.split('\n');
    const problemas = TOKENS_CANONICOS.filter((nome) => {
      const valor = tokens.get(nome) as string;
      return !linhas.some((linha) => linha.includes(`\`${nome}\``) && linha.toLowerCase().includes(valor));
    });
    expect(problemas).toEqual([]);
  });

  it('nenhuma seção vazia: todo título tem conteúdo antes do próximo título do mesmo nível ou acima', () => {
    const linhas = md.split('\n');
    const vazias = linhas.flatMap((linha, i) => {
      const nivel = linha.match(/^(#{1,6}) /)?.[1].length;
      if (!nivel) return [];
      const resto = linhas.slice(i + 1);
      const fim = resto.findIndex((l) => (l.match(/^(#{1,6}) /)?.[1].length ?? 7) <= nivel);
      const conteudo = (fim === -1 ? resto : resto.slice(0, fim)).join('').trim();
      return conteudo ? [] : [linha];
    });
    expect(vazias).toEqual([]);
  });

  it('sem placeholder', () => {
    expect(md).not.toMatch(/\bTODO\b|\bTBD\b/);
    expect(md).not.toMatch(/lorem ipsum/i);
  });

  it('classifica com Observado, Derivado, Proposto e registra o não identificado', () => {
    expect(['Observado', 'Derivado', 'Proposto', 'não identificado'].filter((m) => !md.includes(m))).toEqual([]);
  });
});

describe('.agents/rules/Design-Tokens.md', () => {
  const regra = ler('.agents/rules/Design-Tokens.md');

  it('cita todos os tokens canônicos', () => {
    expect(TOKENS_CANONICOS.filter((t) => !regra.includes(`\`${t}\``))).toEqual([]);
  });
});

describe('achados da revisão final', () => {
  it.each(['docs/design-system.html', 'templates/adai-page-template.html'])(
    '%s: hover em superfície 2 só em componente sem texto suave (par proibido de 4,35:1)',
    (arquivo) => {
      const html = ler(arquivo);
      const css = primeiroStyle(html);
      // Classe que recebe o fundo = última classe do seletor com :hover (".card-evento:hover .card-evento__data").
      const classes = [...css.matchAll(/([^{}]*:hover[^{}]*)\{[^}]*var\(--(?:color-bg-subtle-2|gray-200)\)/g)].flatMap((m) =>
        m[1].split(',').filter((s) => s.includes(':hover')).map((s) => [...s.matchAll(/\.([\w-]+)/g)].pop()?.[1] ?? ''),
      );
      const problemas = classes.filter((classe) =>
        [...html.matchAll(new RegExp(`<(\\w+)[^>]*class="[^"]*\\b${classe}\\b[^"]*"[\\s\\S]*?</\\1>`, 'g'))].some((m) => /\bt-suave\b/.test(m[0])),
      );
      expect(problemas).toEqual([]);
    },
  );

  it('template é portátil: imagens e assets ficam dentro de templates/', () => {
    const html = ler('templates/adai-page-template.html');
    expect([...html.matchAll(/\bsrc="([^"]+)"/g)].map((m) => m[1]).filter((url) => url.startsWith('..'))).toEqual([]);
  });
});

describe('validação do design system nos PRs', () => {
  it.each(['.agents/rules/Pull-Request.md', '.github/pull_request_template.md'])('%s pede a validação com base no design system', (arquivo) => {
    const texto = ler(arquivo);
    const exigido = ['docs/design-system.md', 'Observado', 'Proposto', 'tokens', 'contraste', 'H1'];
    expect(exigido.filter((termo) => !texto.includes(termo))).toEqual([]);
  });
});
