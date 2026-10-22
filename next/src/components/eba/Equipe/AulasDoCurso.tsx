import Image from 'next/image';
import Link from 'next/link';
import type { AulaView } from '@/lib/eba/aula';
import styles from './Equipe.module.css';

export interface AulasDoCursoProps {
  /** Nome do curso (DNA, Reset), para os títulos. */
  nomeDoCurso: string;
  aulas: AulaView[];
  atual: AulaView;
}

/**
 * Aulas de um curso: lista ao lado do vídeo (embaixo no celular), como no site atual. O vídeo é o player
 * do Vimeo (endereço já conferido por `urlDoVideo`).
 */
export function AulasDoCurso({ nomeDoCurso, aulas, atual }: AulasDoCursoProps) {
  return (
    <div className={styles.aulas}>
      <div className={styles.secao}>
        <div className={styles.player}>
          <iframe
            src={atual.videoUrl}
            title={`Vídeo da aula: ${atual.titulo}`}
            allow="fullscreen; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            loading="lazy"
          />
        </div>
        <h2 className={styles.linha}>{atual.titulo}</h2>
        {atual.autor && (
          <div className={styles.autor}>
            {atual.fotoAutor && <Image src={atual.fotoAutor.url} alt={atual.fotoAutor.alt} width={42} height={42} unoptimized />}
            <p className={styles.autorNome}>
              <span>{atual.autor}</span>
              {atual.cargoAutor && <span className={styles.vazio}>{atual.cargoAutor}</span>}
            </p>
          </div>
        )}
        {atual.descricao && <p>{atual.descricao}</p>}
      </div>
      <nav aria-label={`Aulas do ${nomeDoCurso}`} className={styles.aulasLateral}>
        <ol role="list" className={styles.aulasLista}>
          {aulas.map((aula) => (
            <li key={aula.endereco}>
              <Link href={`/eba/equipe/aulas/${aula.curso}/${aula.endereco}`} className={styles.aulasLink} aria-current={aula.endereco === atual.endereco ? 'page' : undefined}>
                {aula.titulo}
              </Link>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}
