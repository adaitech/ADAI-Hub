import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

interface SmartLinkProps extends Omit<ComponentProps<'a'>, 'href' | 'target' | 'rel'> {
  href: string;
  novaAba?: boolean;
  children: ReactNode;
}

/** Link interno (`/...`) usa next/link; externo vira <a>. Nova aba avisa leitores de tela. */
export function SmartLink({ href, novaAba = false, children, ...rest }: SmartLinkProps) {
  const isInternal = href.startsWith('/') && !href.startsWith('//');
  const targetProps = novaAba ? { target: '_blank', rel: 'noopener noreferrer' } : {};
  const content = (
    <>
      {children}
      {novaAba && <span className="visually-hidden"> (abre em nova aba)</span>}
    </>
  );

  if (isInternal) {
    return (
      <Link href={href} {...targetProps} {...rest}>
        {content}
      </Link>
    );
  }

  return (
    <a href={href} {...targetProps} {...rest}>
      {content}
    </a>
  );
}
