'use client';

import styles from './status.module.css';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="conteudo" className={styles.status}>
      <h1 className={styles.titulo}>Não foi possível carregar esta página</h1>
      <p role="alert">Tivemos um problema ao buscar o conteúdo. Tente novamente em instantes.</p>
      <button type="button" className={styles.link} onClick={reset}>
        Tentar novamente
      </button>
    </main>
  );
}
