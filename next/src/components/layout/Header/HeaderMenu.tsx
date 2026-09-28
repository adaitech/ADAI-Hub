'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { SmartLink } from '@/components/ui/SmartLink';
import type { BotaoView, LinkView } from '@/lib/strapi/links';
import styles from './HeaderMenu.module.css';

interface HeaderMenuProps {
  links: LinkView[];
  botoes: BotaoView[];
}

/** Menu do cabeçalho abaixo de 1024px (padrão disclosure: botão + painel). */
export function HeaderMenu({ links, botoes }: HeaderMenuProps) {
  const [aberto, setAberto] = useState(false);
  const painelId = useId();
  const botaoRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!aberto) return;

    const fecharComEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAberto(false);
        botaoRef.current?.focus();
      }
    };
    const desktop = window.matchMedia('(min-width: 1024px)');
    const fecharNoDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setAberto(false);
    };

    document.addEventListener('keydown', fecharComEsc);
    desktop.addEventListener('change', fecharNoDesktop);
    return () => {
      document.removeEventListener('keydown', fecharComEsc);
      desktop.removeEventListener('change', fecharNoDesktop);
    };
  }, [aberto]);

  const fechar = () => setAberto(false);

  return (
    <div className={styles.menu}>
      <button
        ref={botaoRef}
        type="button"
        className={styles.alternar}
        aria-expanded={aberto}
        aria-controls={painelId}
        onClick={() => setAberto((valor) => !valor)}
      >
        <span className={styles.icone} aria-hidden="true" data-aberto={aberto} />
        {aberto ? 'Fechar' : 'Menu'}
      </button>

      <div id={painelId} className={styles.painel} hidden={!aberto}>
        {links.length > 0 && (
          <nav aria-label="Principal">
            <ul role="list" className={styles.lista}>
              {links.map((link) => (
                <li key={`${link.href}-${link.label}`}>
                  <SmartLink href={link.href} novaAba={link.novaAba} className={styles.link} onClick={fechar}>
                    {link.label}
                  </SmartLink>
                </li>
              ))}
            </ul>
          </nav>
        )}
        {botoes.length > 0 && (
          <div className={styles.acoes}>
            {botoes.map((botao) => (
              <ButtonLink
                key={`${botao.href}-${botao.label}`}
                href={botao.href}
                estilo={botao.estilo}
                superficie="clara"
                tamanho="md"
                novaAba={botao.novaAba}
                className={styles.acao}
              >
                {botao.label}
              </ButtonLink>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
