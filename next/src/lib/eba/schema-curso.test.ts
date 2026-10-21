import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { slugDoCurso } from '@/lib/paginas/caminho';

/** O painel do Strapi precisa recusar o mesmo endereço que o site recusaria (senão o curso some sem aviso). */
const schema = JSON.parse(
  readFileSync(join(process.cwd(), '..', 'strapi/src/api/curso/content-types/curso/schema.json'), 'utf8'),
) as { attributes: { slug: { regex?: string } } };

describe('schema do curso no Strapi × endereço no site', () => {
  it('o campo "Endereço" tem regex no Strapi', () => {
    expect(schema.attributes.slug.regex).toBeDefined();
  });

  it.each([['reset', true], ['dna-pais', true], ['Reset', false], ['reset_2', false], ['cdv.', false], ['a--b', false], ['-start', false]])(
    '%p: Strapi aceita = site aceita (%p)',
    (slug, aceito) => {
      expect(new RegExp(schema.attributes.slug.regex ?? '.*').test(slug)).toBe(aceito);
      expect(slugDoCurso(slug) !== null).toBe(aceito);
    },
  );
});
