import Image from 'next/image';
import Link from 'next/link';
import type { CursoResumoView } from '@/lib/eba/types';
import styles from './CardCurso.module.css';

export interface CardCursoProps {
  curso: CursoResumoView;
  /** Nível do título: 3 dentro de uma seção; 2 quando o catálogo abre a página. */
  nivelTitulo?: 2 | 3;
}

/**
 * Card do catálogo no padrão dos cards do Hub (caixa cinza, foto dentro). O card inteiro é clicável
 * por um único link (nome do curso). Para quem e Duração numa lista de definição.
 */
export function CardCurso({ curso, nivelTitulo = 3 }: CardCursoProps) {
  const Titulo = nivelTitulo === 2 ? 'h2' : 'h3';
  const informacoes = curso.chips.slice(0, 2);
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
      </div>
      {informacoes.length > 0 ? (
        <dl className={styles.informacoes}>
          {informacoes.map((item) => (
            <div key={item.rotulo} className={styles.informacao}>
              <dt>{item.rotulo}</dt>
              <dd>{item.valor}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <span />
      )}
      <span className={styles.mais} aria-hidden="true">
        Conhecer o curso
      </span>
    </article>
  );
}
