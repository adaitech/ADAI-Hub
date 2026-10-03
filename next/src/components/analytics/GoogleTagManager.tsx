import Script from 'next/script';
import { getGtmId, getScriptGtm } from '@/lib/analytics/gtm';

/**
 * Google Tag Manager do site (container por ambiente via `NEXT_PUBLIC_GTM_ID`).
 * Sem ID configurado não renderiza nada: dev local, testes e vitrine ficam sem tags.
 * Fica no layout do site, não no raiz: `/componentes` (vitrine) nunca envia dados ao GA4.
 */
export function GoogleTagManager() {
  const gtmId = getGtmId();
  if (!gtmId) return null;

  return (
    <>
      {/* Sem o <noscript> do GTM: sem JavaScript não há aviso de cookies nem como consentir. */}
      <Script id="google-tag-manager" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: getScriptGtm(gtmId) }} />
    </>
  );
}
