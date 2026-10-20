/**
 * Seed de desenvolvimento da EBA (strapi/src/bootstrap/seed-eba.ts) com um Strapi simulado:
 * as páginas só são montadas (e as imagens buscadas) quando vão ser criadas ou reconstruídas.
 */
import { ensurePaginasEba } from '../../../../strapi/src/bootstrap/seed-eba';

function strapiFake(existentes: string[]) {
  const pages = {
    findFirst: jest.fn(async ({ filters }: { filters: { slug: string } }) =>
      existentes.includes(filters.slug) ? { documentId: `doc-${filters.slug}` } : null,
    ),
    create: jest.fn(async ({ data }: { data: { slug: string } }) => ({ documentId: `doc-${data.slug}` })),
    update: jest.fn(async () => ({})),
    publish: jest.fn(async () => ({})),
  };
  const strapi = { documents: () => pages, log: { info: jest.fn(), warn: jest.fn() } };
  return { strapi: strapi as never, pages };
}

describe('ensurePaginasEba', () => {
  it('páginas já existem e o seed não subiu de versão → nada é montado nem gravado', async () => {
    const { strapi, pages } = strapiFake(['eba', 'eba-cursos']);
    const imagem = jest.fn(async () => 1);
    await ensurePaginasEba(strapi, imagem, false);
    expect(imagem).not.toHaveBeenCalled();
    expect(pages.create).not.toHaveBeenCalled();
    expect(pages.update).not.toHaveBeenCalled();
  });

  it('versão nova → reconstrói e publica as duas páginas', async () => {
    const { strapi, pages } = strapiFake(['eba', 'eba-cursos']);
    const imagem = jest.fn(async () => 1);
    await ensurePaginasEba(strapi, imagem, true);
    expect(pages.update).toHaveBeenCalledTimes(2);
    expect(pages.publish).toHaveBeenCalledTimes(2);
    expect(imagem).toHaveBeenCalled();
  });

  it('banco novo → cria "eba" e "eba-cursos" com SEO e seções', async () => {
    const { strapi, pages } = strapiFake([]);
    await ensurePaginasEba(strapi, jest.fn(async () => 1), false);
    const criadas = pages.create.mock.calls.map(([{ data }]) => data as { slug: string; sections: unknown[]; seo: { metaTitle: string } });
    expect(criadas.map((d) => d.slug)).toEqual(['eba', 'eba-cursos']);
    expect(criadas.every((d) => d.sections.length > 0 && d.seo.metaTitle.endsWith('| ADAI'))).toBe(true);
  });
});
