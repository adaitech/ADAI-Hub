/**
 * Páginas restritas da EBA (`/eba/equipe/*` e `/eba/resultado/*`): o endereço delas é uma credencial ou
 * identifica um aluno, então nada de GTM, rastreador de cliques nem aviso de cookies nelas.
 * Se este teste falhar, o endereço de um resultado ou de um aluno pode ir para o Google Analytics.
 */
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const APP = join(__dirname, '../../app');
const ANALYTICS = [/GoogleTagManager/, /RastreadorAnalytics/, /BannerCookies/];

const limpar = (codigo: string) => codigo.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

describe('área restrita sem analytics', () => {
  it('o layout do grupo (restrito) não importa GTM, rastreador nem banner de cookies', () => {
    const layout = limpar(readFileSync(join(APP, '(restrito)/layout.tsx'), 'utf8'));
    for (const proibido of ANALYTICS) expect(layout).not.toMatch(proibido);
  });

  it('o layout do site tem analytics (o teste acima não passa por acaso)', () => {
    const layout = limpar(readFileSync(join(APP, '(site)/layout.tsx'), 'utf8'));
    for (const esperado of ANALYTICS) expect(layout).toMatch(esperado);
  });

  it.each(['eba/equipe', 'eba/resultado'])('%s existe só no grupo (restrito), nunca no (site)', (rota) => {
    expect(existsSync(join(APP, '(restrito)', rota))).toBe(true);
    expect(existsSync(join(APP, '(site)', rota))).toBe(false);
  });

  it('nenhuma outra pasta do app declara rota restrita fora do grupo (restrito)', () => {
    const achadas: string[] = [];
    const varrer = (dir: string) => {
      for (const item of readdirSync(dir, { withFileTypes: true })) {
        if (!item.isDirectory()) continue;
        const caminho = join(dir, item.name);
        if (/eba[\\/](equipe|resultado)$/.test(caminho) && !caminho.includes('(restrito)')) achadas.push(caminho);
        varrer(caminho);
      }
    };
    varrer(APP);
    expect(achadas).toEqual([]);
  });
});
