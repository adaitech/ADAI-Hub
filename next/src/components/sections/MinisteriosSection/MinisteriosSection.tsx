import { ButtonLink } from '@/components/ui/ButtonLink';
import { SmartLink } from '@/components/ui/SmartLink';
import type { SectionProps } from '@/types/sections';
import { normalizeMinisterios } from './normalize';
import type { MinisteriosData, MinisteriosView } from './types';
import styles from './MinisteriosSection.module.css';

type Item = MinisteriosView['ministerios'][number];

function MinisterioLinha({ item }: { item: Item }) {
  const conteudo = (
    <>
      <strong className={styles.nome}>{item.nome}</strong>
      {item.publico && <span className={styles.publico}>{item.publico}</span>}
    </>
  );

  return (
    <li className={styles.item}>
      {item.href ? (
        <SmartLink href={item.href} className={styles.linha}>
          {conteudo}
        </SmartLink>
      ) : (
        <div className={styles.linha}>{conteudo}</div>
      )}
    </li>
  );
}

/**
 * Figma: Encontre seu lugar (1:230) — lista à direita do convite — e "Pra todas as idades"
 * (28:462, páginas das unidades) — `exibicao: 'cards'`: mesma lista, em grade de cards cinza.
 */
export function MinisteriosSection({ data, index }: SectionProps<MinisteriosData>) {
  const view = normalizeMinisterios(data);
  if (!view) return null;

  const Titulo = index === 0 ? 'h1' : 'h2';
  const tituloId = `ministerios-${data.id}-titulo`;

  return (
    <section className={styles.secao} aria-labelledby={tituloId} data-section="ministerios" data-exibicao={view.exibicao}>
      <div className={styles.caixa}>
        <div className={styles.intro}>
          <Titulo id={tituloId} className={styles.titulo}>{view.titulo}</Titulo>
          {view.textoApoio && <p className={styles.apoio}>{view.textoApoio}</p>}
          {view.botao && (
            <ButtonLink href={view.botao.href} estilo={view.botao.estilo} novaAba={view.botao.novaAba} tamanho="md">
              {view.botao.label}
            </ButtonLink>
          )}
        </div>
        <ul className={styles.lista} role="list">
          {view.ministerios.map((item, itemIndex) => <MinisterioLinha key={`${item.id}-${itemIndex}`} item={item} />)}
        </ul>
      </div>
    </section>
  );
}
