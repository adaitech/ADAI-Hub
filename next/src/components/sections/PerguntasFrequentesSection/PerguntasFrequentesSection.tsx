import type { SectionProps } from '@/types/sections';
import { normalizePerguntasFrequentes } from './normalize';
import type { PerguntasFrequentesData } from './types';
import styles from './PerguntasFrequentesSection.module.css';

/** Figma: Perguntas frequentes (31:167). `<details>` preserva teclado e semântica sem JavaScript. */
export function PerguntasFrequentesSection({ data, index }: SectionProps<PerguntasFrequentesData>) {
  const view = normalizePerguntasFrequentes(data);
  if (!view) return null;

  const Titulo = index === 0 ? 'h1' : 'h2';
  const tituloId = `perguntas-frequentes-${data.id}-titulo`;

  return (
    <section className={styles.secao} aria-labelledby={tituloId} data-section="perguntas-frequentes">
      <div className={styles.intro}>
        <Titulo id={tituloId} className={styles.titulo}>{view.titulo}</Titulo>
        {view.textoApoio && <p className={styles.apoio}>{view.textoApoio}</p>}
      </div>
      <div className={styles.lista}>
        {view.perguntas.map((item, i) => (
          <details key={`${item.id}-${i}`} className={styles.item}>
            <summary className={styles.pergunta}>{item.pergunta}</summary>
            <p className={styles.resposta}>{item.resposta}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
