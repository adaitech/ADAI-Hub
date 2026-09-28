import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Vitrine de componentes · ADAI Hub',
  robots: { index: false, follow: false },
};

/** Vitrine só existe em desenvolvimento, ou em homologação com SHOW_COMPONENTS=true. */
export default function ComponentesLayout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === 'production' && process.env.SHOW_COMPONENTS !== 'true') {
    notFound();
  }
  return children;
}
