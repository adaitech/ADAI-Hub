import { Inter, Inter_Tight } from 'next/font/google';

/** Texto e UI (Figma: Inter). */
export const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  display: 'swap',
  variable: '--font-body',
});

/** Display/títulos — substitui a Suisse Int'l do Figma (sem licença). */
export const interTight = Inter_Tight({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-display',
});
