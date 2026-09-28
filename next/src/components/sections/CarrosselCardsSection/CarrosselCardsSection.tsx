import clsx from 'clsx';
import Image from 'next/image';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { TextLink } from '@/components/ui/TextLink';
import type { SectionProps } from '@/types/sections';
import { Carrossel } from './Carrossel';
import { normalizeCarrosselCards } from './normalize';
import type { CardView, CarrosselCardsData } from './types';
import styles from './CarrosselCardsSection.module.css';

function Card({ card, nivelTitulo }: { card: CardView; nivelTitulo: 'h2' | 'h3' }) {
  const TituloCard = nivelTitulo;
  return (
    <li className={styles.card} data-cor={card.cor}>
      {card.imagem && (
        <div className={styles.midia}>
          <Image
            src={card.imagem.url}
            alt={card.imagem.alt}
            fill
            sizes="(min-width: 1024px) 20vw, (min-width: 769px) 40vw, 80vw"
            className={styles.imagem}
          />
        </div>
      )}
      <TituloCard className={styles.titulo}>{card.titulo}</TituloCard>
      {card.destaques.length > 0 && (
        <ul role="list" className={styles.destaques}>
          {card.destaques.map((destaque, i) => (
            <li key={i}>{destaque}</li>
          ))}
        </ul>
      )}
      {card.texto.length > 0 && (
        <p className={styles.texto}>
          {card.texto.map((linha, i) => (
            <span key={i} className={styles.linha}>
              {linha}
            </span>
          ))}
        </p>
      )}
      {(card.botao || card.link) && (
        <div className={styles.acoes}>
          {card.botao && (
            <ButtonLink
              href={card.botao.href}
              estilo={card.botao.estilo}
              superficie={card.superficie}
              tamanho="md"
              novaAba={card.botao.novaAba}
            >
              {card.botao.label}
            </ButtonLink>
          )}
          {card.link && (
            <TextLink href={card.link.href} novaAba={card.link.novaAba} superficie={card.superficie}>
              {card.link.label}
            </TextLink>
          )}
        </div>
      )}
    </li>
  );
}

/**
 * Figma: "Neste domingo (Unidades)" (node 1:51). Título + texto de apoio + fileira de cards
 * com setas (carrossel com retorno). Cards com 2 ou 3 destaques ficam alinhados (subgrid).
 */
export function CarrosselCardsSection({ data, index }: SectionProps<CarrosselCardsData>) {
  const view = normalizeCarrosselCards(data);
  if (!view) return null;

  const Titulo = index === 0 ? 'h1' : 'h2';
  const tituloId = `carrossel-${data.id}-titulo`;

  return (
    <section className={styles.secao} aria-labelledby={tituloId} data-section="carrossel-cards">
      <div className={styles.intro}>
        <Titulo id={tituloId} className={styles.tituloSecao}>
          {view.titulo}
        </Titulo>
        {view.textoApoio && <p className={styles.apoio}>{view.textoApoio}</p>}
      </div>

      <Carrossel
        rotulo={view.titulo}
        total={view.cards.length}
        trilhaClassName={clsx(
          styles.trilha,
          view.temImagem && styles.comImagem,
          view.temImagem && view.posicaoImagem === 'abaixo' && styles.imagemAbaixo,
          view.temImagem && view.estiloImagem === 'arte' && styles.arte,
        )}
        acessorio={
          view.link && (
            <TextLink href={view.link.href} novaAba={view.link.novaAba}>
              {view.link.label}
            </TextLink>
          )
        }
      >
        {view.cards.map((card) => (
          <Card key={card.id} card={card} nivelTitulo={Titulo === 'h1' ? 'h2' : 'h3'} />
        ))}
      </Carrossel>
    </section>
  );
}
