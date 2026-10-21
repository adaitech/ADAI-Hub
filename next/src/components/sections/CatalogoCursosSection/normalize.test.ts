import { normalizeCatalogoCursos } from './normalize';
import type { CatalogoCursosData } from './types';

const base: CatalogoCursosData = { __component: 'sections.catalogo-cursos', id: 1, titulo: 'Cursos' };

describe('normalizeCatalogoCursos', () => {
  it('sem título → null (a seção não aparece)', () => {
    expect(normalizeCatalogoCursos({ ...base, titulo: '  ' })).toBeNull();
  });

  it('padrões: todas as vertentes, todos os cursos, com "Ver todos os cursos"', () => {
    expect(normalizeCatalogoCursos(base)).toEqual({ titulo: 'Cursos', vertente: 'todas', quantidade: null, verTodos: true });
  });

  it('apara o texto de apoio e respeita vertente, quantidade e link desligado', () => {
    expect(normalizeCatalogoCursos({ ...base, texto_apoio: ' Escolha. ', vertente: 'integracao', quantidade: 3, link_ver_todos: false })).toEqual({
      titulo: 'Cursos',
      textoApoio: 'Escolha.',
      vertente: 'integracao',
      quantidade: 3,
      verTodos: false,
    });
  });

  it.each([[0], [13], [2.5], [-1]])('quantidade fora de 1–12 (%p) → todos os cursos', (quantidade) => {
    expect(normalizeCatalogoCursos({ ...base, quantidade })?.quantidade).toBeNull();
  });
});
