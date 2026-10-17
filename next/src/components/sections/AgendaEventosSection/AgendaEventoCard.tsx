import Image from 'next/image';
import { SmartLink } from '@/components/ui/SmartLink';
import { urlDoEvento } from '@/lib/inchurch/detalhes';
import type { AgendaEventoCardView } from './types';
import styles from './AgendaEventosSection.module.css';

interface AgendaEventoCardProps {
  card: AgendaEventoCardView;
  tituloId: string;
}

/** O card navega aos detalhes; a inscrição permanece na página do evento. */
export function AgendaEventoCard({ card, tituloId }: AgendaEventoCardProps) {
  const badges = card.badges ?? (card.badge ? [card.badge] : []);
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
        {badges.length > 0 && <div className={styles.badges}>{badges.map((badge, i) => <p key={`${badge}-${i}`} className={styles.badge}>{badge}</p>)}</div>}
      </div>
      <div className={styles.conteudo}>
        <h3 id={tituloId} className={styles.titulo}>
          <SmartLink className={styles.linkCard} href={urlDoEvento({ id: card.id, nome: card.titulo })}>{card.titulo}</SmartLink>
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
