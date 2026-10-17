import Image from 'next/image';
import type { AgendaEventoCardView } from './types';
import styles from './AgendaEventosSection.module.css';

interface AgendaEventoCardProps {
  card: AgendaEventoCardView;
  tituloId: string;
}

/** Card somente informativo: inscrição e participação serão decididas em uma etapa futura. */
export function AgendaEventoCard({ card, tituloId }: AgendaEventoCardProps) {
  return (
    <article className={styles.card} aria-labelledby={tituloId}>
      <div className={styles.midia}>
        {card.imagem ? (
          <Image
            src={card.imagem.url}
            alt=""
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 769px) 45vw, 100vw"
            className={styles.imagem}
          />
        ) : (
          <p className={styles.fallbackData} aria-hidden="true">
            <span>{card.fallbackData?.dia}</span>
            <span>{card.fallbackData?.mes}</span>
          </p>
        )}
        {card.badge && <p className={styles.badge}>{card.badge}</p>}
      </div>
      <div className={styles.conteudo}>
        <h3 id={tituloId} className={styles.titulo}>
          {card.titulo}
        </h3>
        <p className={styles.data}>
          {card.destaques.split('\n').map((linha) => (
            <span key={linha}>{linha}</span>
          ))}
        </p>
        {card.recorrencia && <p className={styles.recorrencia}>{card.recorrencia}</p>}
        {card.descricao && <p className={styles.descricao}>{card.descricao}</p>}
      </div>
    </article>
  );
}
