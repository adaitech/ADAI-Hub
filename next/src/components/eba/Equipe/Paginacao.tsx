import Link from 'next/link';
import styles from './Equipe.module.css';

/** Anterior e próxima por link (`?pagina=N`): a página mostra todos os alunos, não só os 10 primeiros. */
export function Paginacao({ pagina, totalPaginas, base }: { pagina: number; totalPaginas: number; base: string }) {
  if (totalPaginas <= 1) return null;
  return (
    <nav aria-label="Páginas de alunos" className={styles.paginacao}>
      {pagina > 1 ? <Link href={`${base}?pagina=${pagina - 1}`} rel="prev">Página anterior</Link> : null}
      <span aria-current="page">
        Página {pagina} de {totalPaginas}
      </span>
      {pagina < totalPaginas ? <Link href={`${base}?pagina=${pagina + 1}`} rel="next">Próxima página</Link> : null}
    </nav>
  );
}
