import type { ReactNode } from 'react';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { SkipLink } from '@/components/layout/SkipLink/SkipLink';
import { getGlobal } from '@/lib/strapi/queries/global';

/**
 * Páginas restritas (`/eba/equipe/*` e `/eba/resultado/*`): o endereço delas é uma credencial (código do
 * resultado) ou identifica um aluno. Por isso este layout **não carrega** o Google Tag Manager, o
 * rastreador de cliques nem o aviso de cookies: nenhum endereço nem texto da tela vai para o GA4. O
 * teste `area-restrita-sem-analytics` garante isso. Quem navega do site para cá usa link comum (carga
 * completa), para o GTM do site não continuar na página.
 */
export default async function RestritoLayout({ children }: { children: ReactNode }) {
  const global = await getGlobal();
  return (
    <>
      <SkipLink />
      <Header data={global?.header} aoVivoUrl={null} />
      <main id="conteudo" tabIndex={-1}>
        {children}
      </main>
      <Footer data={global?.footer} />
    </>
  );
}
