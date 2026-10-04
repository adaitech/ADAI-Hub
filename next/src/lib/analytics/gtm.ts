/**
 * Google Tag Manager da ADAI. Os IDs são públicos (aparecem no HTML de qualquer site com GTM):
 * não são segredo. O container é escolhido por `NEXT_PUBLIC_GTM_ID` em cada ambiente.
 * O GA4 (`G-SCG09PWV8B`) é configurado DENTRO do GTM (tag "Google tag"), nunca direto no código —
 * carregar gtag.js e GTM juntos duplicaria as visualizações de página.
 */
export const GTM_PRODUCAO = 'GTM-5MGM7CK2';
export const GTM_HOMOLOGACAO = 'GTM-5945V9DQ';
export const GA4_MEASUREMENT_ID = 'G-SCG09PWV8B';

/** Chave do consentimento no navegador (lida antes do GTM carregar). */
export const CHAVE_CONSENTIMENTO = 'adai-consentimento-cookies';
/** Versão do aviso: subir quando o texto mudar → todos escolhem de novo (e o GTM não carrega até lá). */
export const VERSAO_CONSENTIMENTO = 2;

const ID_GTM = /^GTM-[A-Z0-9]{4,12}$/;

/** ID do container configurado, ou `null` (sem GTM: dev local, testes, vitrine). */
export function getGtmId(valor: string | undefined = process.env.NEXT_PUBLIC_GTM_ID): string | null {
  const id = valor?.trim().toUpperCase();
  return id && ID_GTM.test(id) ? id : null;
}

/** `producao` só no container de produção; o resto é homologação (filtrável no GA4). */
export function getAmbiente(gtmId: string | null = getGtmId()): 'producao' | 'homologacao' {
  return gtmId === GTM_PRODUCAO ? 'producao' : 'homologacao';
}

/**
 * Script inline do site. Política de Privacidade: **nada vai ao Google antes do aceite**.
 * 1) Consent Mode v2 com tudo negado; 2) `adaiCarregarGtm()` guarda o snippet oficial do GTM sem
 * executá-lo; 3) só com aceite salvo (mesma versão do aviso) libera analytics e carrega o GTM.
 * Quem aceita depois carrega pelo aviso de cookies (`salvarConsentimento`). Eventos empurrados antes
 * ficam na fila do `dataLayer` e são processados quando o GTM carrega (já com consentimento).
 * Anúncios ficam sempre negados: o site não usa publicidade.
 */
export function getScriptGtm(gtmId: string): string {
  return `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',functionality_storage:'granted',security_storage:'granted'});
window.adaiCarregarGtm=function(){if(window.adaiGtmCarregado)return;window.adaiGtmCarregado=true;(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;var n=d.querySelector('script[nonce]');n&&j.setAttribute('nonce',n.nonce||n.getAttribute('nonce'));j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');};
try{var c=JSON.parse(localStorage.getItem('${CHAVE_CONSENTIMENTO}')||'null');if(c&&c.versao===${VERSAO_CONSENTIMENTO}&&c.analytics===true){gtag('consent','update',{analytics_storage:'granted'});window.adaiCarregarGtm();}}catch(e){}`;
}
