import type { ReactNode } from 'react';
import Markdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SmartLink } from '@/components/ui/SmartLink';
import { sanitizeHref } from '@/lib/strapi/links';
import type { SectionProps } from '@/types/sections';
import { normalizeTextoRico } from './normalize';
import type { TextoRicoData } from './types';
import styles from './TextoRicoSection.module.css';

type Nivel = 2 | 3 | 4 | 5 | 6;

/**
 * Títulos do Markdown ficam sempre abaixo do título da seção (hierarquia correta para SEO e
 * leitores de tela): na 1ª seção da página o título é h1 e "##" vira h2; mais abaixo, h2 e h3.
 */
function componentes(deslocamento: 0 | 1): Components {
  // Cada tabela é uma região com nome único (axe: landmark-unique).
  let tabelas = 0;
  const titulo = (nivelMd: number) =>
    function Titulo({ children }: { children?: ReactNode }) {
      const nivel = Math.min(6, Math.max(2, nivelMd) + deslocamento) as Nivel;
      const Tag = `h${nivel}` as const;
      return <Tag className={styles[`h${nivel}`]}>{children}</Tag>;
    };

  return {
    h1: titulo(1),
    h2: titulo(2),
    h3: titulo(3),
    h4: titulo(4),
    h5: titulo(5),
    h6: titulo(6),
    a({ href, children }) {
      const destino = sanitizeHref(href);
      if (!destino) return <>{children}</>;
      const externo = /^https?:\/\//i.test(destino);
      return (
        <SmartLink href={destino} novaAba={externo} className={styles.link}>
          {children}
        </SmartLink>
      );
    },
    table({ children }) {
      // Tabela larga rola para o lado no celular; a região recebe foco para rolar pelo teclado.
      tabelas += 1;
      return (
        <div className={styles.tabela} role="region" aria-label={`Tabela ${tabelas} (role para os lados no celular)`} tabIndex={0}>
          <table>{children}</table>
        </div>
      );
    },
  };
}

/**
 * Documento longo editado no Strapi em Markdown (Política de Privacidade, termos, regulamentos).
 * Renderizado no servidor; HTML cru no Markdown é ignorado (`skipHtml`) e links passam por
 * `sanitizeHref` (bloqueia `javascript:`).
 */
export function TextoRicoSection({ data, index }: SectionProps<TextoRicoData>) {
  const view = normalizeTextoRico(data);
  if (!view) return null;

  const Titulo = index === 0 ? 'h1' : 'h2';
  const tituloId = `texto-rico-${data.id}-titulo`;

  return (
    <section className={styles.secao} aria-labelledby={tituloId} data-section="texto-rico">
      <article className={styles.artigo}>
        <header className={styles.cabecalho}>
          <Titulo id={tituloId} className={styles.titulo}>
            {view.titulo}
          </Titulo>
          {view.atualizadoEm && (
            <p className={styles.atualizado}>
              Última atualização: <time dateTime={view.atualizadoEmIso ?? undefined}>{view.atualizadoEm}</time>.
            </p>
          )}
        </header>
        <div className={styles.conteudo}>
          <Markdown remarkPlugins={[remarkGfm]} skipHtml components={componentes(index === 0 ? 0 : 1)}>
            {view.conteudo}
          </Markdown>
        </div>
      </article>
    </section>
  );
}
