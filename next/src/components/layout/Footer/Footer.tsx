import Link from 'next/link';
import { Logo } from '@/components/icons/Logo';
import { SmartLink } from '@/components/ui/SmartLink';
import { normalizeFooter } from './normalize';
import type { FooterData } from './types';
import styles from './Footer.module.css';

interface FooterProps {
  data: FooterData | null | undefined;
}

/** Figma: "Footer" (node 1:306). Textos e colunas vêm de `global.footer`; logo e "ADAI" gigante são fixos. */
export function Footer({ data }: FooterProps) {
  const { textoMarca, colunas, copyright, assinatura } = normalizeFooter(data);

  return (
    <footer className={styles.footer} data-section="footer">
      <div className={styles.container}>
        <div className={styles.grade}>
          <div className={styles.marca}>
            <Link href="/" className={styles.logo} aria-label="ADAI, página inicial">
              <Logo enquadramento="justo" />
            </Link>
            {textoMarca && <p className={styles.textoMarca}>{textoMarca}</p>}
          </div>

          {colunas.length > 0 && (
            <nav aria-label="Rodapé" className={styles.colunas}>
              {colunas.map((coluna) => (
                <div key={coluna.titulo} className={styles.coluna}>
                  <h2 className={styles.tituloColuna}>{coluna.titulo}</h2>
                  <ul role="list" className={styles.links}>
                    {coluna.links.map((link) => (
                      <li key={`${link.href}-${link.label}`}>
                        <SmartLink href={link.href} novaAba={link.novaAba} className={styles.link}>
                          {link.label}
                        </SmartLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          )}
        </div>

        {(copyright || assinatura) && (
          <div className={styles.linhaFinal}>
            {copyright && <p>{copyright}</p>}
            {assinatura && <p>{assinatura}</p>}
          </div>
        )}

        <p className={styles.mega} aria-hidden="true">
          ADAI
        </p>
      </div>
    </footer>
  );
}
