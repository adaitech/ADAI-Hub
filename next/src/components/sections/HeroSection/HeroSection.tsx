import Image from 'next/image';
import { ButtonLink } from '@/components/ui/ButtonLink';
import type { SectionProps } from '@/types/sections';
import { normalizeHero } from './normalize';
import type { HeroData } from './types';
import styles from './HeroSection.module.css';

/** Figma: "Hero" (node 1:32). Abertura da página com foto em P&B, frase principal e CTAs. */
export function HeroSection({ data, index }: SectionProps<HeroData>) {
  const view = normalizeHero(data);
  if (!view) return null;

  const Titulo = index === 0 ? 'h1' : 'h2';
  const tituloId = `hero-${data.id}-titulo`;
  const temApoio = view.paragrafos.length > 0 || view.botoes.length > 0;

  return (
    <section className={styles.hero} aria-labelledby={tituloId} data-section="hero">
      <div className={styles.cartao}>
        {view.imagem && (
          <Image
            src={view.imagem.url}
            alt={view.imagem.alt}
            fill
            sizes="100vw"
            priority={index === 0}
            className={styles.imagem}
          />
        )}
        <div className={styles.degrade} aria-hidden="true" />

        <div className={styles.conteudo}>
          <Titulo id={tituloId} className={styles.titulo}>
            {view.linhas.map((linha, i) => (
              <span key={i} className={styles.linha}>
                {linha}
              </span>
            ))}
          </Titulo>

          {temApoio && (
            <div className={styles.apoio}>
              {view.paragrafos.length > 0 && (
                <div className={styles.texto}>
                  {view.paragrafos.map((paragrafo, i) => (
                    <p key={i}>{paragrafo}</p>
                  ))}
                </div>
              )}
              {view.botoes.length > 0 && (
                <div className={styles.botoes}>
                  {view.botoes.map((botao) => (
                    <ButtonLink
                      key={`${botao.href}-${botao.label}`}
                      href={botao.href}
                      estilo={botao.estilo}
                      superficie="escura"
                      tamanho="md"
                      novaAba={botao.novaAba}
                    >
                      {botao.label}
                    </ButtonLink>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
