import Link from 'next/link';
import type { ReactNode } from 'react';
import styles from './vitrine.module.css';

export default function VitrineLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.vitrine}>
      <header className={styles.topo}>
        <Link href="/componentes" className={styles.marca}>
          Vitrine de componentes <span className={styles.selo}>ADAI Hub</span>
        </Link>
        <Link href="/" className={styles.linkSite}>
          Ver o site
        </Link>
      </header>
      <main id="conteudo" className={styles.conteudo}>
        {children}
      </main>
    </div>
  );
}
