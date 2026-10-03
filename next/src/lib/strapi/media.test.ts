import { STRAPI_URL } from './client';
import { resolveStrapiMedia, resolveStrapiUrl } from './media';

describe('resolveStrapiUrl', () => {
  it('upload do Strapi (/uploads/...) vira URL absoluta do Strapi', () => {
    expect(resolveStrapiUrl('/uploads/hero.jpg')).toBe(`${STRAPI_URL}/uploads/hero.jpg`);
  });

  it('URL absoluta (CDN/provedor de upload) fica como está', () => {
    expect(resolveStrapiUrl('https://cdn.exemplo.com/hero.jpg')).toBe('https://cdn.exemplo.com/hero.jpg');
  });

  it('arquivo do próprio site (mocks da vitrine) fica relativo', () => {
    expect(resolveStrapiUrl('/mocks/hero.jpg')).toBe('/mocks/hero.jpg');
  });
});

describe('resolveStrapiMedia', () => {
  it('normaliza URL, alt e dimensões', () => {
    expect(
      resolveStrapiMedia({ id: 1, url: '/uploads/a.jpg', alternativeText: '  Família no culto ', width: 1200, height: 630 }),
    ).toEqual({ url: `${STRAPI_URL}/uploads/a.jpg`, alt: 'Família no culto', width: 1200, height: 630 });
  });

  it('sem texto alternativo → alt vazio (imagem decorativa, nunca "undefined")', () => {
    expect(resolveStrapiMedia({ id: 1, url: '/uploads/a.jpg', alternativeText: null })?.alt).toBe('');
  });

  it('sem dimensões → 0 (o componente usa `fill`)', () => {
    expect(resolveStrapiMedia({ id: 1, url: '/uploads/a.jpg' })).toMatchObject({ width: 0, height: 0 });
  });

  it('sem mídia ou sem URL → null', () => {
    expect(resolveStrapiMedia(null)).toBeNull();
    expect(resolveStrapiMedia(undefined)).toBeNull();
    expect(resolveStrapiMedia({ id: 1, url: '  ' })).toBeNull();
  });
});
