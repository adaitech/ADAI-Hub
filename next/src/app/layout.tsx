import type { Metadata } from 'next';
import { connection } from 'next/server';
import type { ReactNode } from 'react';
import { inter, interTight } from './fonts';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'ADAI',
  description: 'Amar a Deus. Servir as pessoas. Influenciar o mundo.',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // CSP com nonce (src/proxy.ts): todo HTML é gerado na requisição, senão sai sem o nonce e o
  // navegador bloqueia os scripts do Next. Os dados continuam no cache (fetch com revalidate).
  await connection();

  return (
    <html lang="pt-BR" className={`${inter.variable} ${interTight.variable}`}>
      <body>{children}</body>
    </html>
  );
}
