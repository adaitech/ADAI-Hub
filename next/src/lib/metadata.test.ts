import { buildMetadata } from './metadata';
import { STRAPI_URL } from './strapi/client';
import type { StrapiSeo } from './strapi/types';

const pagina: StrapiSeo = {
  id: 1,
  metaTitle: 'Política de Privacidade e Cookies | ADAI',
  metaDescription: 'Como a ADAI trata seus dados pessoais e usa cookies no site.',
  metaImage: { id: 2, url: '/uploads/og.jpg', alternativeText: 'Logo da ADAI', width: 1200, height: 630 },
};
const padrao: StrapiSeo = {
  id: 9,
  metaTitle: 'ADAI — Amar. Servir. Influenciar.',
  metaDescription: 'Uma igreja que ama, serve e influencia.',
  metaImage: { id: 3, url: '/uploads/padrao.jpg', alternativeText: '', width: 1200, height: 630 },
};

describe('buildMetadata', () => {
  it('usa o SEO da página: título, descrição, canonical do caminho e Open Graph em pt-BR', () => {
    const meta = buildMetadata(pagina, padrao, '/politica-de-privacidade');
    expect(meta).toMatchObject({
      title: pagina.metaTitle,
      description: pagina.metaDescription,
      alternates: { canonical: '/politica-de-privacidade' },
      openGraph: {
        title: pagina.metaTitle,
        description: pagina.metaDescription,
        type: 'website',
        locale: 'pt_BR',
        url: '/politica-de-privacidade',
        images: [{ url: `${STRAPI_URL}/uploads/og.jpg`, width: 1200, height: 630, alt: 'Logo da ADAI' }],
      },
    });
    expect(meta.metadataBase).toBeInstanceOf(URL);
  });

  it('página sem SEO → usa o SEO padrão de "Configurações do site" (global)', () => {
    const meta = buildMetadata(null, padrao, '/kids');
    expect(meta.title).toBe(padrao.metaTitle);
    expect(meta.description).toBe(padrao.metaDescription);
    expect(meta.openGraph?.images).toEqual([expect.objectContaining({ url: `${STRAPI_URL}/uploads/padrao.jpg` })]);
  });

  it('campos faltando são completados campo a campo', () => {
    const meta = buildMetadata({ id: 1, metaTitle: 'Kids | ADAI' }, padrao, '/kids');
    expect(meta.title).toBe('Kids | ADAI');
    expect(meta.description).toBe(padrao.metaDescription);
  });

  it('sem SEO nenhum → título "ADAI", sem descrição e sem imagem (nunca "undefined" no HTML)', () => {
    const meta = buildMetadata(undefined, undefined);
    expect(meta.title).toBe('ADAI');
    expect(meta.description).toBeUndefined();
    expect(meta.openGraph?.images).toBeUndefined();
    expect(meta.alternates?.canonical).toBe('/');
  });

  it('"Meta robots" do Strapi com noindex/nofollow vira <meta name="robots"> (coerente com o sitemap)', () => {
    expect(buildMetadata({ ...pagina, metaRobots: 'noindex, nofollow' }, padrao, '/kids').robots).toEqual({ index: false, follow: false });
    expect(buildMetadata({ ...pagina, metaRobots: 'noindex' }, padrao, '/kids').robots).toEqual({ index: false, follow: true });
  });

  it('sem "Meta robots" (o normal) → nenhuma regra própria; o SEO padrão do site não tira páginas do Google', () => {
    expect(buildMetadata(pagina, { ...padrao, metaRobots: 'noindex' }, '/kids').robots).toBeUndefined();
  });

  it('canonicalURL do Strapi tem prioridade sobre o caminho', () => {
    const meta = buildMetadata({ ...pagina, canonicalURL: 'https://adai.com.br/privacidade' }, padrao, '/politica-de-privacidade');
    expect(meta.alternates?.canonical).toBe('https://adai.com.br/privacidade');
  });
});
