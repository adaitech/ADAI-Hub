import Image from 'next/image';
import Link from 'next/link';
import type { CursoResumoView } from '@/lib/eba/types';
import { Chips } from '../Chips';
import styles from './CardCurso.module.css';

export interface CardCursoProps {
  curso: CursoResumoView;
  /** Nível do título: 3 dentro de uma seção; 2 quando o catálogo abre a página. */
  nivelTitulo?: 2 | 3;
}

/** Card do catálogo: o card inteiro é clicável por um único link (nome do curso). */
export function CardCurso({ curso, nivelTitulo = 3 }: CardCursoProps) {
  const Titulo = nivelTitulo === 2 ? 'h2' : 'h3';
  return (
    <article className={styles.card}>
      {curso.capa ? (
        <Image
          className={styles.foto}
          src={curso.capa.url}
          alt={curso.capa.alt}
          width={curso.capa.width || 1600}
          height={curso.capa.height || 1066}
          sizes="(min-width: 1024px) 25vw, (min-width: 769px) 50vw, 100vw"
        />
      ) : (
        <div className={styles.semFoto} aria-hidden="true">
          {curso.nome}
        </div>
      )}
      <div className={styles.texto}>
        <p className={styles.vertente}>{curso.rotuloVertente}</p>
        <Titulo className={styles.titulo}>
          <Link href={curso.href} className={styles.link}>
            {curso.nome}
          </Link>
        </Titulo>
        <p className={styles.resumo}>{curso.resumo}</p>
        <Chips itens={curso.chips.slice(0, 2)} />
        <p className={styles.mais} aria-hidden="true">
          Conhecer o curso →
        </p>
      </div>
    </article>
  );
}
