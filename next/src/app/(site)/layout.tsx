import type { ReactNode } from 'react';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { PreviewBanner } from '@/components/layout/PreviewBanner/PreviewBanner';
import { SkipLink } from '@/components/layout/SkipLink/SkipLink';
import { getGlobal } from '@/lib/strapi/queries/global';

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const global = await getGlobal();

  return (
    <>
      <SkipLink />
      <PreviewBanner />
      <Header data={global?.header} />
      <main id="conteudo" tabIndex={-1}>
        {children}
      </main>
      <Footer data={global?.footer} />
    </>
  );
}
