import Link from 'next/link';
import styles from './status.module.css';

export default function NotFound() {
  return (
    <main id="conteudo" className={styles.status}>
      <h1 className={styles.titulo}>Página não encontrada</h1>
      <p>O endereço pode ter mudado ou a página ainda não foi publicada.</p>
      <Link href="/" className={styles.link}>
        Voltar para a página inicial
      </Link>
    </main>
  );
}
