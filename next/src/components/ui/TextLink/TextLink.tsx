import clsx from 'clsx';
import type { ReactNode } from 'react';
import { SmartLink } from '../SmartLink';
import styles from './TextLink.module.css';

export interface TextLinkProps {
  href: string;
  children: ReactNode;
  novaAba?: boolean;
  /** Fundo onde o link está. */
  superficie?: 'clara' | 'escura';
  className?: string;
}

/** Link de ação secundária: texto sublinhado com seta (Figma: "HorizontalBorder" dos cards de unidade). */
export function TextLink({ href, children, novaAba = false, superficie = 'clara', className }: TextLinkProps) {
  return (
    <SmartLink href={href} novaAba={novaAba} className={clsx(styles.link, styles[superficie], className)}>
      <span className={styles.texto}>{children}</span>
      <svg className={styles.seta} width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" focusable="false">
        <path d="M1 7h11M8 3l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </SmartLink>
  );
}
