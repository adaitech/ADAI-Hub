import { caminhoDaPagina, slugDaPaginaSobreNos } from './caminho';

describe('caminhoDaPagina (slug do Strapi → endereço no site)', () => {
  it('home é a raiz; páginas comuns ficam na raiz', () => {
    expect(caminhoDaPagina('home')).toBe('/');
    expect(caminhoDaPagina('jesus')).toBe('/jesus');
    expect(caminhoDaPagina('campestre')).toBe('/campestre');
  });

  it('"sobre-nos-…" vira /sobre-nos/… (o Strapi não aceita "/" no slug)', () => {
    expect(caminhoDaPagina('sobre-nos-nossa-historia')).toBe('/sobre-nos/nossa-historia');
    expect(caminhoDaPagina('sobre-nos-a-igreja-que-vemos')).toBe('/sobre-nos/a-igreja-que-vemos');
  });

  it('slugDaPaginaSobreNos: segmento da URL → slug do Strapi; segmento inválido → null', () => {
    expect(slugDaPaginaSobreNos('nossa-historia')).toBe('sobre-nos-nossa-historia');
    expect(slugDaPaginaSobreNos('Nossa História')).toBeNull();
    expect(slugDaPaginaSobreNos('')).toBeNull();
  });
});
