import clsx from 'clsx';
import type { ReactNode } from 'react';
import { SmartLink } from '../SmartLink';
import styles from './ButtonLink.module.css';

export interface ButtonLinkProps {
  href: string;
  children: ReactNode;
  /** `solido` = ação principal (preenchido); `contorno` = ação secundária (só borda). */
  estilo?: 'solido' | 'contorno';
  /** Fundo onde o botão está: `clara` (página branca) ou `escura` (sobre foto/fundo escuro). */
  superficie?: 'clara' | 'escura';
  /** `sm` = 40px (header, desktop); `md` = 52px (seções). */
  tamanho?: 'sm' | 'md';
  novaAba?: boolean;
  className?: string;
}

type EstiloBotao = Pick<ButtonLinkProps, 'estilo' | 'superficie' | 'tamanho' | 'className'>;

/**
 * Classes visuais do botão, para quando a ação não navega (ex.: abrir o player de vídeo).
 * Use num `<button type="button">`; para navegação continue usando `ButtonLink`.
 */
export function buttonClassName({ estilo = 'solido', superficie = 'clara', tamanho = 'md', className }: EstiloBotao = {}): string {
  return clsx(styles.botao, styles[estilo], styles[superficie], styles[tamanho], className);
}

/** CTA com aparência de botão. Todo CTA do site navega, por isso é um link. */
export function ButtonLink({
  href,
  children,
  estilo = 'solido',
  superficie = 'clara',
  tamanho = 'md',
  novaAba = false,
  className,
}: ButtonLinkProps) {
  return (
    <SmartLink
      href={href}
      novaAba={novaAba}
      className={buttonClassName({ estilo, superficie, tamanho, className })}
    >
      {children}
    </SmartLink>
  );
}
