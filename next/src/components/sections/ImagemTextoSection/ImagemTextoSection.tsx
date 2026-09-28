import Image from 'next/image';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { TextLink } from '@/components/ui/TextLink';
import type { SectionProps } from '@/types/sections';
import { normalizeImagemTexto } from './normalize';
import type { ImagemTextoData } from './types';
import styles from './ImagemTextoSection.module.css';

/**
 * Figma: "Primeira vez" (node 1:107, foto à esquerda) e "Nossa Liderança" (node 6:4, foto à direita).
 * Foto grande de um lado; rótulo, título grande, texto, lista, botão e link do outro.
 */
export function ImagemTextoSection({ data, index }: SectionProps<ImagemTextoData>) {
  const view = normalizeImagemTexto(data);
  if (!view) return null;

  const Titulo = index === 0 ? 'h1' : 'h2';
  const tituloId = `imagem-texto-${data.id}-titulo`;

  return (
    <section
      className={styles.secao}
      aria-labelledby={tituloId}
      data-section="imagem-texto"
      data-posicao={view.posicao}
      data-sem-imagem={view.imagem ? undefined : 'true'}
    >
      {view.imagem && (
        <div className={styles.midia} data-pb={view.pretoEBranco ? 'true' : 'false'}>
          <Image
            src={view.imagem.url}
            alt={view.imagem.alt}
            fill
            sizes="(min-width: 1024px) 44vw, 100vw"
            priority={index === 0}
            className={styles.imagem}
          />
        </div>
      )}

      <div className={styles.conteudo}>
        {view.rotulo && <p className={styles.rotulo}>{view.rotulo}</p>}
        <Titulo id={tituloId} className={styles.titulo}>
          {view.linhasTitulo.map((linha, i) => (
            <span key={i} className={styles.linha}>
              {linha}
            </span>
          ))}
        </Titulo>

        {view.paragrafos.length > 0 && (
          <div className={styles.texto}>
            {view.paragrafos.map((paragrafo, i) => (
              <p key={i}>{paragrafo}</p>
            ))}
          </div>
        )}

        {view.lista.length > 0 && (
          <ul role="list" className={styles.lista}>
            {view.lista.map((item) => (
              <li key={item.titulo} className={styles.item}>
                <strong className={styles.itemTitulo}>{item.titulo}</strong>
                {item.texto && <span className={styles.itemTexto}>{item.texto}</span>}
              </li>
            ))}
          </ul>
        )}

        {(view.botao || view.link) && (
          <div className={styles.acoes}>
            {view.botao && (
              <ButtonLink href={view.botao.href} estilo={view.botao.estilo} tamanho="md" novaAba={view.botao.novaAba}>
                {view.botao.label}
              </ButtonLink>
            )}
            {view.link && (
              <TextLink href={view.link.href} novaAba={view.link.novaAba}>
                {view.link.label}
              </TextLink>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
