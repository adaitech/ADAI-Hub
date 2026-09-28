import Link from 'next/link';
import { Logo } from '@/components/icons/Logo';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { SmartLink } from '@/components/ui/SmartLink';
import { HeaderMenu } from './HeaderMenu';
import { normalizeHeader } from './normalize';
import type { HeaderData } from './types';
import styles from './Header.module.css';

interface HeaderProps {
  data: HeaderData | null | undefined;
}

/** Figma: "Header" (node 1:13). Logo fixo + menu e botões vindos de `global.header` no Strapi. */
export function Header({ data }: HeaderProps) {
  const { links, botoes } = normalizeHeader(data);
  const temMenu = links.length > 0 || botoes.length > 0;

  return (
    <header className={styles.header} data-section="header">
      <div className={styles.barra}>
        <Link href="/" className={styles.logo} aria-label="ADAI, página inicial">
          <Logo />
        </Link>

        {links.length > 0 && (
          <nav aria-label="Principal" className={styles.navDesktop}>
            <ul role="list" className={styles.lista}>
              {links.map((link) => (
                <li key={`${link.href}-${link.label}`}>
                  <SmartLink href={link.href} novaAba={link.novaAba} className={styles.link}>
                    {link.label}
                  </SmartLink>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {botoes.length > 0 && (
          <div className={styles.acoesDesktop}>
            {botoes.map((botao) => (
              <ButtonLink
                key={`${botao.href}-${botao.label}`}
                href={botao.href}
                estilo={botao.estilo}
                superficie="clara"
                tamanho="sm"
                novaAba={botao.novaAba}
              >
                {botao.label}
              </ButtonLink>
            ))}
          </div>
        )}

        {temMenu && <HeaderMenu links={links} botoes={botoes} />}
      </div>
    </header>
  );
}
