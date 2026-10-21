import fixture from '@/lib/eba/__fixtures__/cursos.json';
import { filtrarCursos, normalizeCursoResumo } from '@/lib/eba/curso';
import type { CursoResumoView, StrapiCurso } from '@/lib/eba/types';
import { defineShowcase } from '@/lib/showcase/types';
import { CatalogoCursos } from './CatalogoCursos';
import mocks from './CatalogoCursosSection.mock.json';
import { normalizeCatalogoCursos } from './normalize';
import type { CatalogoCursosData, CatalogoCursosExemplo } from './types';

/** Cursos da fixture (formato da API); fotos de public/mocks para a vitrine funcionar sem o Strapi. */
const cursos = (fixture.data as StrapiCurso[])
  .map((c) => normalizeCursoResumo(c) as CursoResumoView)
  .map((c) => (c.capa ? { ...c, capa: { ...c.capa, url: `/mocks/eba/${c.slug}-capa.webp` } } : c));

const strapi = (data: CatalogoCursosExemplo) => data.strapi;
const comStrapi = (data: CatalogoCursosExemplo, mudanca: Partial<CatalogoCursosData>): CatalogoCursosExemplo => ({
  ...data,
  strapi: { ...data.strapi, ...mudanca },
});

export const catalogoCursosShowcase = defineShowcase<CatalogoCursosExemplo>({
  slug: 'catalogo-cursos',
  nome: 'Catálogo de cursos (EBA)',
  categoria: 'secao',
  cmsKey: 'sections.catalogo-cursos',
  descricao: 'Cards dos cursos da EBA publicados no Strapi, em ordem. O editor escolhe título, vertente e quantidade; os cursos entram sozinhos.',
  quandoUsar: 'Na home da EBA (com "Ver todos os cursos") e abrindo /eba/cursos (sem limite). Sem cursos, some — ou mostra "Novos cursos em breve" quando abre a página.',
  doc: 'docs/componentes/catalogo-cursos.md',
  cms: strapi,
  render: ({ strapi: data, cursos: lista, index }) => {
    const view = normalizeCatalogoCursos(data);
    if (!view) return null;
    return (
      <CatalogoCursos
        id={String(data.id)}
        titulo={view.titulo}
        textoApoio={view.textoApoio}
        cursos={filtrarCursos(lista, { vertente: view.vertente, quantidade: view.quantidade })}
        verTodos={view.verTodos}
        nivelTitulo={index === 0 ? 1 : 2}
        mostrarVazio={index === 0}
      />
    );
  },
  variantes: [
    { nome: 'completo', titulo: 'Home da EBA', data: { strapi: mocks.completo as CatalogoCursosData, cursos, index: 2 } },
    { nome: 'minimo', titulo: 'Abrindo /eba/cursos', data: { strapi: mocks.minimo as CatalogoCursosData, cursos, index: 0 } },
    { nome: 'texto_longo', titulo: 'Texto longo, 3 cursos', data: { strapi: mocks.texto_longo as CatalogoCursosData, cursos, index: 2 } },
    { nome: 'vazio', titulo: 'Sem cursos publicados', descricao: 'Abrindo a página: mensagem com contato.', data: { strapi: mocks.minimo as CatalogoCursosData, cursos: [], index: 0 } },
  ],
  controles: [
    {
      id: 'vertente',
      tipo: 'opcoes',
      rotulo: 'Quais cursos',
      opcoes: [
        { valor: 'todas', rotulo: 'Todas' },
        { valor: 'integracao', rotulo: 'Integração' },
        { valor: 'consolidacao', rotulo: 'Consolidação' },
      ],
      valor: (data) => data.strapi.vertente ?? 'todas',
      aplicar: (data, valor) => comStrapi(data, { vertente: valor as CatalogoCursosData['vertente'] }),
    },
    {
      id: 'quantidade',
      tipo: 'opcoes',
      rotulo: 'Quantos cursos mostrar',
      opcoes: [
        { valor: 'todos', rotulo: 'Todos' },
        { valor: '2', rotulo: '2' },
        { valor: '3', rotulo: '3' },
      ],
      valor: (data) => (data.strapi.quantidade ? String(data.strapi.quantidade) : 'todos'),
      aplicar: (data, valor) => comStrapi(data, { quantidade: valor === 'todos' ? null : Number(valor) }),
    },
    {
      id: 'ver_todos',
      tipo: 'alternar',
      rotulo: 'Mostrar "Ver todos os cursos"',
      valor: (data) => data.strapi.link_ver_todos !== false,
      aplicar: (data, ligado) => comStrapi(data, { link_ver_todos: ligado }),
    },
  ],
});
