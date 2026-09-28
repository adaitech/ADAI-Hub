import Image from 'next/image';
import { ButtonLink, buttonClassName } from '@/components/ui/ButtonLink';
import { formatarDia } from '@/lib/youtube/domingos';
import type { ParteSerie, SerieAtual as SerieAtualView } from '@/lib/youtube/serie';
import { AssistirVideo } from './AssistirVideo';
import styles from './SerieAtualSection.module.css';

interface SerieAtualProps {
  view: SerieAtualView;
  /** Posição na página (0 = primeira): define h1/h2. */
  index: number;
  id: number;
}

const ROTULO_BOTAO: Record<ParteSerie['status'], string> = {
  published: 'Assistir mensagem',
  live: 'Assistir ao vivo',
  'waiting-sermon-cut': 'Assistir culto',
  upcoming: '',
};

function nomeDaParte(parte: ParteSerie): string {
  return parte.titulo ? `Parte ${parte.parte}: ${parte.titulo}` : `Parte ${parte.parte}`;
}

/** "Pr. Rodrigo Soeiro, domingo 20 de Setembro." — sem inventar o que o YouTube não informa. */
function detalheDaParte(parte: ParteSerie): string | null {
  if (parte.status === 'live') return null;
  const dia = parte.data ? `domingo ${formatarDia(parte.data)}` : null;
  if (parte.status === 'waiting-sermon-cut') {
    return `Culto completo${dia ? ` de ${dia}` : ''}. A mensagem editada será publicada em breve.`;
  }
  const texto = [parte.pregador, dia].filter(Boolean).join(', ');
  return texto ? `${texto}.` : null;
}

function IconePlay() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
      <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />
    </svg>
  );
}

function CardParte({ parte, nivel }: { parte: ParteSerie; nivel: 'h2' | 'h3' }) {
  const Titulo = nivel;
  if (!parte.video) {
    return (
      <li className={styles.parte} data-status="upcoming">
        <Titulo className={styles.parteTitulo}>{nomeDaParte(parte)}</Titulo>
        <p className={styles.parteMeta}>Mensagem ainda não disponível</p>
      </li>
    );
  }
  return (
    <li className={styles.parte} data-status={parte.status}>
      {parte.data && <p className={styles.parteMeta}>{formatarDia(parte.data)}</p>}
      <Titulo className={styles.parteTitulo}>
        <AssistirVideo video={parte.video} titulo={nomeDaParte(parte)} className={styles.parteGatilho}>
          {nomeDaParte(parte)}
        </AssistirVideo>
      </Titulo>
      {parte.pregador && <p className={`${styles.parteMeta} ${styles.parteRodape}`}>{parte.pregador}</p>}
    </li>
  );
}

/**
 * Figma: "Mensagens" (node 1:132). Só apresentação: recebe o view model pronto
 * (`montarSerieAtual`) e não sabe nada de YouTube ou Strapi.
 */
export function SerieAtual({ view, index, id }: SerieAtualProps) {
  const { serie, atual, partes } = view;
  if (!atual?.video) return null;

  const Titulo = index === 0 ? 'h1' : 'h2';
  const tituloId = `serie-atual-${id}-titulo`;
  const outras = partes.filter((p) => p !== atual);
  const detalhe = detalheDaParte(atual);
  const nomeAtual = `${serie.titulo} — ${nomeDaParte(atual)}`;

  return (
    <section className={styles.secao} aria-labelledby={tituloId} data-section="serie-atual">
      <div className={styles.caixa}>
        <div className={styles.texto}>
          <p className={styles.rotulo}>Série atual</p>
          <Titulo id={tituloId} className={styles.titulo}>
            {serie.titulo}
          </Titulo>
          {atual.status === 'live' && (
            <p className={styles.aoVivo}>
              <span className={styles.pontoAoVivo} aria-hidden="true" />
              Ao vivo agora
            </p>
          )}
          <p className={styles.descricao}>
            <span className={styles.linha}>{nomeDaParte(atual)}</span>
            {detalhe && <span className={styles.linha}>{detalhe}</span>}
          </p>
          <div className={styles.acoes}>
            <AssistirVideo video={atual.video} titulo={nomeAtual} className={buttonClassName({ className: styles.botao })}>
              {ROTULO_BOTAO[atual.status]}
            </AssistirVideo>
            <ButtonLink href={serie.playlistUrl} estilo="contorno" novaAba>
              Todas as mensagens
            </ButtonLink>
          </div>
        </div>

        <div className={styles.midia}>
          <AssistirVideo video={atual.video} titulo={nomeAtual} rotulo={`${ROTULO_BOTAO[atual.status]}: ${nomeDaParte(atual)}`} className={styles.thumbGatilho}>
            {atual.video.thumbnail && (
              <Image
                src={atual.video.thumbnail.url}
                alt=""
                fill
                sizes="(min-width: 1024px) 45vw, 100vw"
                className={styles.thumb}
              />
            )}
            <span className={styles.play} aria-hidden="true">
              <IconePlay />
            </span>
          </AssistirVideo>
        </div>
      </div>

      {outras.length > 0 && (
        <ul role="list" className={styles.partes} aria-label={`Partes da série ${serie.titulo}`} data-colunas={Math.min(outras.length, 4)}>
          {outras.map((parte) => (
            <CardParte key={parte.parte} parte={parte} nivel={Titulo === 'h1' ? 'h2' : 'h3'} />
          ))}
        </ul>
      )}
    </section>
  );
}
