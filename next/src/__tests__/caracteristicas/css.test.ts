/**
 * Característica: regras de CSS do projeto (CSS-Mobile-First.md, Design-Tokens.md) checadas em
 * todos os arquivos `.css` — arquivo novo entra sozinho.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const src = join(process.cwd(), 'src');

function arquivosCss(pasta: string): string[] {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);
    return statSync(caminho).isDirectory() ? arquivosCss(caminho) : nome.endsWith('.css') ? [caminho] : [];
  });
}

const css = arquivosCss(src).map((caminho) => ({
  arquivo: relative(src, caminho).replace(/\\/g, '/'),
  // Comentários podem citar valores do Figma (#F2F2F2): não contam.
  fonte: readFileSync(caminho, 'utf8').replace(/\/\*[\s\S]*?\*\//g, ''),
}));

describe('CSS mobile-first', () => {
  it('media queries só de largura mínima nos breakpoints 769px / 1024px (ou preferências do usuário)', () => {
    const PERMITIDAS = new Set(['(min-width: 769px)', '(min-width: 1024px)', '(prefers-reduced-motion: reduce)', '(hover: hover)', '(prefers-contrast: more)']);
    const problemas = css.flatMap(({ arquivo, fonte }) =>
      [...fonte.matchAll(/@media\s+([^{]+)\{/g)].map((m) => m[1].trim()).filter((q) => !PERMITIDAS.has(q)).map((q) => `${arquivo}: @media ${q}`),
    );
    expect(problemas).toEqual([]);
  });
});

describe('tokens', () => {
  it('cor só por token: nada de hex/rgb/hsl fora de styles/tokens.css', () => {
    const problemas = css
      .filter(({ arquivo }) => arquivo !== 'styles/tokens.css')
      .flatMap(({ arquivo, fonte }) => [...fonte.matchAll(/#[0-9a-f]{3,8}\b|\b(rgba?|hsla?)\(/gi)].map((m) => `${arquivo}: ${m[0]}`));
    expect(problemas).toEqual([]);
  });

  it('todo var(--token) usado existe em tokens.css (ou é definido no próprio arquivo)', () => {
    // Fontes: variáveis criadas pelo next/font em app/fonts.ts (`variable: '--font-…'`).
    const fontes = [...readFileSync(join(src, 'app/fonts.ts'), 'utf8').matchAll(/variable:\s*'(--[\w-]+)'/g)].map((m) => m[1]);
    const definidos = new Set([...fontes, ...css.flatMap(({ fonte }) => [...fonte.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]))]);
    const problemas = css.flatMap(({ arquivo, fonte }) =>
      [...fonte.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]).filter((t) => !definidos.has(t)).map((t) => `${arquivo}: ${t}`),
    );
    expect([...new Set(problemas)]).toEqual([]);
  });
});

describe('scroll horizontal', () => {
  it('todo contêiner com scroll próprio é posicionado (position), para prender elementos absolutos', () => {
    // Sem isso, um `.visually-hidden` (position: absolute) dentro da trilha do carrossel escapa
    // do recorte e alarga a página inteira no celular — bug real corrigido em 2026-10-03.
    const problemas = css.flatMap(({ arquivo, fonte }) =>
      [...fonte.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
        .filter(([, , corpo]) => /overflow(-x)?\s*:\s*(auto|scroll)/.test(corpo) && !/(^|;|\s)position\s*:/.test(corpo))
        .map(([, seletor]) => `${arquivo}: ${seletor.trim()}`),
    );
    expect(problemas).toEqual([]);
  });
});
