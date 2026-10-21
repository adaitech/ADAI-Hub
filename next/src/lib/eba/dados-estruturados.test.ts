import fixture from './__fixtures__/cursos.json';
import { normalizeCurso, normalizeCursoResumo } from './curso';
import { schemaDaTrilha, schemaDoCatalogo, schemaDoCurso } from './dados-estruturados';
import type { CursoResumoView, CursoView, StrapiCurso } from './types';

const site = 'https://adai.com.br';
const [talmidimCru, resetCru] = fixture.data as StrapiCurso[];

describe('dados estruturados da EBA (JSON-LD)', () => {
  it('Course com nome, descrição, URL absoluta e a ADAI como provedora', () => {
    expect(schemaDoCurso(normalizeCurso(talmidimCru) as CursoView, site)).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: 'Talmidim',
      description: 'Acompanhamento do adolescente no início de uma nova caminhada com Jesus.',
      url: 'https://adai.com.br/eba/cursos/talmidim',
      provider: { '@type': 'Organization', name: 'ADAI', sameAs: site },
    });
  });

  it('ItemList do catálogo na ordem recebida, com posição a partir de 1', () => {
    const cursos = [resetCru, talmidimCru].map((c) => normalizeCursoResumo(c) as CursoResumoView);
    expect(schemaDoCatalogo(cursos, site)).toEqual({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, url: 'https://adai.com.br/eba/cursos/reset', name: 'Reset' },
        { '@type': 'ListItem', position: 2, url: 'https://adai.com.br/eba/cursos/talmidim', name: 'Talmidim' },
      ],
    });
  });

  it('BreadcrumbList: itens com link viram URL absoluta; o último (página atual) vai sem URL', () => {
    const itens = [{ texto: 'ADAI', href: '/' }, { texto: 'EBA', href: '/eba' }, { texto: 'Cursos' }];
    expect(schemaDaTrilha(itens, site)).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'ADAI', item: 'https://adai.com.br/' },
        { '@type': 'ListItem', position: 2, name: 'EBA', item: 'https://adai.com.br/eba' },
        { '@type': 'ListItem', position: 3, name: 'Cursos' },
      ],
    });
  });
});
