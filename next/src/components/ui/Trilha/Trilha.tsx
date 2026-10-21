import Link from 'next/link';
import styles from './Trilha.module.css';

export interface TrilhaItem {
  texto: string;
  /** Sem `href` = página atual (último item). */
  href?: string;
}

/** Breadcrumb: completo a partir de 769px; no celular mostra só "‹ <nível anterior>". */
export function Trilha({ itens }: { itens: TrilhaItem[] }) {
  if (itens.length < 2) return null;
  const ultimo = itens.length - 1;
  return (
    // data-section: cliques na trilha saem com origem "trilha" no DataLayer.
    <nav aria-label="Trilha" className={styles.trilha} data-section="trilha">
      <ol className={styles.lista}>
        {itens.map((item, i) => (
          <li key={`${i}-${item.texto}`} className={i === ultimo - 1 ? styles.anterior : styles.item}>
            {i === ultimo || !item.href ? (
              <span aria-current="page" className={styles.atual}>
                {item.texto}
              </span>
            ) : (
              <Link href={item.href} className={styles.link}>
                {item.texto}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
