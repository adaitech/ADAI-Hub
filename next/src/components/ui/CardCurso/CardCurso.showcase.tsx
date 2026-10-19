import fixture from '@/lib/eba/__fixtures__/cursos.json';
import { normalizeCursoResumo } from '@/lib/eba/curso';
import type { CursoResumoView, StrapiCurso } from '@/lib/eba/types';
import { defineShowcase } from '@/lib/showcase/types';
import { CardCurso, type CardCursoProps } from './CardCurso';

const [talmidim, reset, start] = (fixture.data as StrapiCurso[]).map((c) => normalizeCursoResumo(c) as CursoResumoView);
// Na vitrine as fotos vêm de public/mocks (o Strapi pode estar desligado).
const comFotoLocal = (curso: CursoResumoView, arquivo: string): CursoResumoView =>
  curso.capa ? { ...curso, capa: { ...curso.capa, url: `/mocks/eba/${arquivo}` } } : curso;

export const cardCursoShowcase = defineShowcase<CardCursoProps>({
  slug: 'card-curso',
  nome: 'Card de curso',
  categoria: 'ui',
  cmsKey: null,
  descricao: 'Card do catálogo da EBA: foto, vertente, nome, resumo e duas informações. O card inteiro leva à página do curso.',
  quandoUsar: 'Só dentro do Catálogo de cursos. Os dados vêm do curso publicado no Strapi.',
  doc: 'docs/componentes/catalogo-cursos.md',
  render: (data) => (
    <div style={{ padding: 24, maxWidth: 360 }}>
      <CardCurso {...data} />
    </div>
  ),
  variantes: [
    { nome: 'completo', titulo: 'Com foto', data: { curso: comFotoLocal(talmidim, 'talmidim-capa.webp') } },
    { nome: 'minimo', titulo: 'Sem foto', data: { curso: start } },
    { nome: 'texto_longo', titulo: 'Resumo longo', data: { curso: comFotoLocal(reset, 'reset-capa.webp') } },
  ],
});
