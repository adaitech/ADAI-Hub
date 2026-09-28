import { ButtonLink } from '@/components/ui/ButtonLink';
import type { SectionProps } from '@/types/sections';
import { normalizeTextoBotoes } from './normalize';
import type { TextoBotoesData } from './types';
import styles from './TextoBotoesSection.module.css';

/** Figma: App (1:296). Chamada reutilizável de texto com até duas ações. */
export function TextoBotoesSection({ data, index }: SectionProps<TextoBotoesData>) {
  const view = normalizeTextoBotoes(data);
  if (!view) return null;

  const Titulo = index === 0 ? 'h1' : 'h2';
  const tituloId = `texto-botoes-${data.id}-titulo`;

  return (
    <section className={styles.secao} aria-labelledby={tituloId} data-section="texto-botoes">
      <Titulo id={tituloId} className={styles.titulo}>{view.titulo}</Titulo>
      {view.textoApoio && <p className={styles.apoio}>{view.textoApoio}</p>}
      {view.botoes.length > 0 && (
        <div className={styles.acoes}>
          {view.botoes.map((botao, i) => (
            <ButtonLink key={`${botao.href}-${i}`} href={botao.href} estilo={botao.estilo} tamanho="sm" novaAba={botao.novaAba}>
              {botao.label}
            </ButtonLink>
          ))}
        </div>
      )}
    </section>
  );
}
