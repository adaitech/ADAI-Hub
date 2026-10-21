import fixture from '@/lib/eba/__fixtures__/cursos.json';
import { normalizeCurso, videoDoYoutube } from '@/lib/eba/curso';
import type { CursoView, StrapiCurso } from '@/lib/eba/types';
import { defineShowcase } from '@/lib/showcase/types';
import { CursoCabecalho, type CursoCabecalhoProps } from './CursoCabecalho';

const [talmidimCru, resetCru, startCru] = fixture.data as StrapiCurso[];
const fotoLocal = (curso: CursoView): CursoView =>
  curso.capa ? { ...curso, capa: { ...curso.capa, url: `/mocks/eba/${curso.slug}-capa.webp` } } : curso;
const trilha = (nome: string) => [{ texto: 'ADAI', href: '/' }, { texto: 'EBA', href: '/eba' }, { texto: 'Cursos', href: '/eba/cursos' }, { texto: nome }];

const talmidim: CursoView = {
  ...fotoLocal(normalizeCurso(talmidimCru) as CursoView),
  temPerguntasFrequentes: true,
  // Vídeo de exemplo só na vitrine: nenhum curso tem vídeo de apresentação hoje.
  video: videoDoYoutube('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
};
const start = normalizeCurso(startCru) as CursoView;
const reset = fotoLocal(normalizeCurso(resetCru) as CursoView);

export const cursoCabecalhoShowcase = defineShowcase<CursoCabecalhoProps>({
  slug: 'curso-cabecalho',
  nome: 'Topo do curso (EBA)',
  categoria: 'layout',
  cmsKey: null,
  descricao: 'Abertura da página de um curso: trilha, vertente, nome, resumo, informações, inscrição e capa. Vem dos campos fixos do curso no Strapi.',
  quandoUsar: 'Só na página /eba/cursos/<endereço>. O corpo da página vem depois, com as seções que o editor montou.',
  doc: 'docs/componentes/curso-cabecalho.md',
  render: (data) => <CursoCabecalho {...data} />,
  variantes: [
    { nome: 'completo', titulo: 'Completo (Talmidim)', descricao: 'Com perguntas frequentes e vídeo de exemplo.', data: { curso: talmidim, trilha: trilha('Talmidim') } },
    { nome: 'minimo', titulo: 'Mínimo (sem capa nem inscrição)', data: { curso: start, trilha: trilha('Start') } },
    { nome: 'texto_longo', titulo: 'Quatro informações (Reset)', data: { curso: reset, trilha: trilha('Reset') } },
  ],
  controles: [
    {
      id: 'capa',
      tipo: 'alternar',
      rotulo: 'Foto de capa',
      ajuda: 'Sem texto alternativo, a foto não aparece.',
      valor: (data) => data.curso.capa !== null,
      aplicar: (data, ligado) => ({ ...data, curso: { ...data.curso, capa: ligado ? (talmidim.capa ?? null) : null } }),
    },
    {
      id: 'inscricao',
      tipo: 'alternar',
      rotulo: 'Botão de inscrição',
      valor: (data) => data.curso.inscricao !== null,
      aplicar: (data, ligado) => ({ ...data, curso: { ...data.curso, inscricao: ligado ? talmidim.inscricao : null } }),
    },
    {
      id: 'video',
      tipo: 'alternar',
      rotulo: 'Vídeo de apresentação',
      valor: (data) => data.curso.video !== null,
      aplicar: (data, ligado) => ({ ...data, curso: { ...data.curso, video: ligado ? talmidim.video : null } }),
    },
  ],
});
