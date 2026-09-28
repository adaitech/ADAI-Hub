import Link from 'next/link';
import { categoriaLabel, showcaseCatalog } from '@/lib/showcase/catalog';
import type { ShowcaseCategoria } from '@/lib/showcase/types';
import styles from './vitrine.module.css';

const ORDEM: ShowcaseCategoria[] = ['secao', 'layout', 'ui'];

export default function VitrineIndex() {
  return (
    <>
      <h1 className={styles.titulo}>Componentes</h1>
      <p className={styles.intro}>
        Todos os componentes do site, renderizados com o mesmo conteúdo que o Strapi entrega. Cada página mostra as
        variações, como fica no celular, tablet e computador, e o <strong>guia de como preencher no Strapi</strong>.
      </p>

      {ORDEM.map((categoria) => {
        const itens = showcaseCatalog.filter((entry) => entry.categoria === categoria);
        if (itens.length === 0) return null;
        return (
          <section key={categoria} className={styles.grupo} aria-labelledby={`grupo-${categoria}`}>
            <h2 id={`grupo-${categoria}`} className={styles.subtitulo}>
              {categoriaLabel[categoria]}
            </h2>
            <ul role="list" className={styles.cards}>
              {itens.map((entry) => (
                <li key={entry.slug}>
                  <Link href={`/componentes/${entry.slug}`} className={styles.card}>
                    <span className={styles.cardNome}>{entry.nome}</span>
                    <span className={styles.cardDescricao}>{entry.descricao}</span>
                    {entry.cmsKey && <code className={styles.chave}>{entry.cmsKey}</code>}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
