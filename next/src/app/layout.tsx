import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { inter, interTight } from './fonts';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'ADAI',
  description: 'Amar a Deus. Servir as pessoas. Influenciar o mundo.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${interTight.variable}`}>
      <body>{children}</body>
    </html>
  );
}
