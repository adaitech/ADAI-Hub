import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getEditorGuide } from '@/lib/editor-guide';
import { categoriaLabel, getShowcase, showcaseCatalog } from '@/lib/showcase/catalog';
import { controlesInfo, valoresPadrao } from '@/lib/showcase/controles';
import { EditorGuidePanel } from '../../_vitrine/EditorGuidePanel';
import { VariantesTabs } from '../../_vitrine/VariantesTabs';
import styles from '../vitrine.module.css';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return showcaseCatalog.map((entry) => ({ slug: entry.slug }));
}

/** Título próprio por componente (aba do navegador e histórico), sempre fora do Google. */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = getShowcase(slug);
  return { title: entry ? `${entry.nome} · Vitrine de componentes` : 'Vitrine de componentes · ADAI Hub' };
}

export default async function ComponentePage({ params }: PageProps) {
  const { slug } = await params;
  const entry = getShowcase(slug);
  if (!entry) notFound();

  const guia = entry.cmsKey ? getEditorGuide(entry.cmsKey) : null;

  return (
    <>
      <nav aria-label="Trilha" className={styles.trilha}>
        <Link href="/componentes">Componentes</Link> / <span aria-current="page">{entry.nome}</span>
      </nav>

      <h1 className={styles.titulo}>{entry.nome}</h1>
      <p className={styles.intro}>{entry.descricao}</p>

      <dl className={styles.ficha}>
        <div>
          <dt>Quando usar</dt>
          <dd>{entry.quandoUsar}</dd>
        </div>
        <div>
          <dt>Categoria</dt>
          <dd>{categoriaLabel[entry.categoria]}</dd>
        </div>
        {entry.cmsKey && (
          <div>
            <dt>Nome no Strapi</dt>
            <dd>
              <code className={styles.chave}>{entry.cmsKey}</code>
            </dd>
          </div>
        )}
        <div>
          <dt>Documentação</dt>
          <dd>
            <code>{entry.doc}</code>
          </dd>
        </div>
        {entry.figma && (
          <div>
            <dt>Figma</dt>
            <dd>
              <a href={entry.figma} target="_blank" rel="noopener noreferrer">
                Abrir no Figma<span className="visually-hidden"> (abre em nova aba)</span>
              </a>
            </dd>
          </div>
        )}
      </dl>

      <section aria-labelledby="variantes" className={styles.bloco}>
        <h2 id="variantes" className={styles.subtitulo}>
          Exemplos
        </h2>
        <p className={styles.blocoIntro}>
          Escolha um exemplo na aba e use os controles para ligar e desligar opções, como o editor faria no Strapi.
        </p>
        <VariantesTabs
          slug={entry.slug}
          nomeComponente={entry.nome}
          rotuloJson={
            entry.cms
              ? 'Dados deste exemplo (strapi = configuração no CMS; youtube = resultado normalizado)'
              : entry.cmsKey
                ? 'JSON do Strapi deste exemplo'
                : 'Props deste exemplo'
          }
          controles={controlesInfo(entry)}
          variantes={entry.variantes.map((v) => ({
            nome: v.nome,
            titulo: v.titulo,
            descricao: v.descricao,
            data: v.data,
            padrao: valoresPadrao(entry, v.data),
          }))}
        />
      </section>

      {guia && <EditorGuidePanel guia={guia} />}
    </>
  );
}
