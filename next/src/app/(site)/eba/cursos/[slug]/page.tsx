import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Fragment } from 'react';
import { ANCORA_PERGUNTAS, CursoCabecalho, CursoInscricao } from '@/components/layout/CursoCabecalho';
import { CatalogoCursos } from '@/components/sections/CatalogoCursosSection/CatalogoCursos';
import { SectionRenderer } from '@/components/sections/SectionRenderer';
import type { TrilhaItem } from '@/components/ui/Trilha';
import { filtrarCursos } from '@/lib/eba/curso';
import { schemaDaTrilha, schemaDoCurso } from '@/lib/eba/dados-estruturados';
import type { CursoView } from '@/lib/eba/types';
import { buildMetadata } from '@/lib/metadata';
import { caminhoDoCurso, slugDoCurso } from '@/lib/paginas/caminho';
import { jsonLdSeguro, origemDoSite } from '@/lib/seo/json-ld';
import { getCursoBySlug, listarCursosPublicados } from '@/lib/strapi/queries/cursos';
import { getGlobal } from '@/lib/strapi/queries/global';

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** Slug fora do padrão → 404 sem chamar o Strapi; inexistente → 404; erro do Strapi → lança (error.tsx). */
async function carregar(segmento: string): Promise<CursoView> {
  const slug = slugDoCurso(segmento);
  if (!slug) notFound();
  const curso = await getCursoBySlug(slug);
  if (!curso) notFound();
  return curso;
}

const trilhaDo = (curso: CursoView): TrilhaItem[] => [
  { texto: 'ADAI', href: '/' },
  { texto: 'EBA', href: '/eba' },
  { texto: 'Cursos', href: '/eba/cursos' },
  { texto: curso.nome },
];

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const curso = await carregar((await params).slug);
  const global = await getGlobal();
  const padrao = {
    id: 0,
    metaTitle: `${curso.nome} — Cursos da EBA | ADAI`,
    metaDescription: curso.resumo,
    metaImage: curso.capa ? { id: 0, url: curso.capa.url, alternativeText: curso.capa.alt, width: curso.capa.width, height: curso.capa.height } : null,
  };
  // SEO do Strapi vale campo a campo; o que faltar (ex.: imagem) vem do próprio curso.
  const preenchidos = Object.fromEntries(Object.entries(curso.seo ?? {}).filter(([, valor]) => valor !== null && valor !== undefined && valor !== ''));
  const seo = { ...padrao, ...preenchidos };
  return buildMetadata(seo, global?.seo, caminhoDoCurso(curso.slug));
}

/** /eba/cursos/<slug> — topo do curso (campos fixos) + corpo do Strapi + inscrição + outros cursos. */
export default async function CursoEbaPage({ params }: PageProps) {
  const curso = await carregar((await params).slug);
  const site = origemDoSite();
  const trilha = trilhaDo(curso);
  const outros = filtrarCursos(await listarCursosPublicados().catch(() => []), { vertente: curso.vertente, quantidade: 3, excluirSlug: curso.slug });
  const primeiraFaq = curso.secoes.findIndex((s) => s.__component === 'sections.perguntas-frequentes');

  return (
    <>
      <script type="application/ld+json">{jsonLdSeguro(schemaDoCurso(curso, site))}</script>
      <script type="application/ld+json">{jsonLdSeguro(schemaDaTrilha(trilha, site))}</script>
      <CursoCabecalho curso={curso} trilha={trilha} />
      {curso.secoes.map((secao, i) => (
        <Fragment key={`${secao.__component}-${secao.id}`}>
          {i === primeiraFaq && <span id={ANCORA_PERGUNTAS} />}
          {/* index + 1: o h1 da página é o topo do curso; as seções do corpo usam h2. */}
          <SectionRenderer sections={[secao]} indiceInicial={i + 1} />
        </Fragment>
      ))}
      <CursoInscricao curso={curso} />
      <CatalogoCursos id={`outros-${curso.slug}`} titulo="Outros cursos" textoApoio="Continue sua formação na EBA." cursos={outros} verTodos nivelTitulo={2} mostrarVazio={false} />
    </>
  );
}
