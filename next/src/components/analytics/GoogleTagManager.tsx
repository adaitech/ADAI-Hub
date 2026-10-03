import { headers } from 'next/headers';
import Script from 'next/script';
import { getGtmId, getScriptGtm } from '@/lib/analytics/gtm';

/**
 * Google Tag Manager do site (container por ambiente via `NEXT_PUBLIC_GTM_ID`).
 * Sem ID configurado não renderiza nada: dev local, testes e vitrine ficam sem tags.
 * Fica no layout do site, não no raiz: `/componentes` (vitrine) nunca envia dados ao GA4.
 */
export async function GoogleTagManager() {
  const gtmId = getGtmId();
  if (!gtmId) return null;
  // CSP estrita: script inline só roda com o nonce desta requisição (gerado no proxy.ts).
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  return (
    <>
      {/* Sem o <noscript> do GTM: sem JavaScript não há aviso de cookies nem como consentir. */}
      <Script id="google-tag-manager" strategy="afterInteractive" nonce={nonce} dangerouslySetInnerHTML={{ __html: getScriptGtm(gtmId) }} />
    </>
  );
}
