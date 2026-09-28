import styles from './SkipLink.module.css';

/** Primeiro item focável da página: pula direto para o <main id="conteudo">. */
export function SkipLink() {
  return (
    <a href="#conteudo" className={styles.skipLink}>
      Pular para o conteúdo principal
    </a>
  );
}
