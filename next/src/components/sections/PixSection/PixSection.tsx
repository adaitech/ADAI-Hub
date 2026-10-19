import { CopyButton } from '@/components/ui/CopyButton/CopyButton';
import { TextLink } from '@/components/ui/TextLink';
import type { SectionProps } from '@/types/sections';
import { normalizePix } from './normalize';
import type { PixData } from './types';
import styles from './PixSection.module.css';

export function PixSection({ data, index }: SectionProps<PixData>) {
  const view = normalizePix(data);
  if (!view) return null;
  const Titulo = index === 0 ? 'h1' : 'h2';
  const tituloId = `pix-${data.id}-titulo`;
  return (
    <section id={view.ancora} className={styles.secao} aria-labelledby={tituloId} data-section="pix">
      <div className={styles.caixa}>
        <div className={styles.intro}>
          <Titulo id={tituloId} className={styles.titulo}>{view.titulo}</Titulo>
          {view.apoio && <p className={styles.apoio}>{view.apoio}</p>}
          {view.passos.length > 0 && <ol className={styles.passos}>{view.passos.map((passo, i) => <li key={i}>{passo}</li>)}</ol>}
        </div>
        <div className={styles.card}>
          <h3 className={styles.subtitulo}>Dízimos e ofertas</h3>
          <p className={styles.chave}>{view.chave}</p>
          <CopyButton valor={view.chave} rotulo="Copiar chave Pix" />
          {view.contato && <div className={styles.contato}><p>Outras formas de contribuir</p><TextLink href={view.contato.href} novaAba={view.contato.novaAba}>{view.contato.label}</TextLink></div>}
        </div>
      </div>
    </section>
  );
}
