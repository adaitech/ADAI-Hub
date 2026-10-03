import { CHAVE_CONSENTIMENTO, VERSAO_CONSENTIMENTO } from './gtm';

export { VERSAO_CONSENTIMENTO };

declare global {
  interface Window {
    /** Definida pelo script do GTM (`gtm.ts`): carrega o container uma única vez. */
    adaiCarregarGtm?: () => void;
  }
}

/** Escolha salva no navegador. `versao` permite pedir de novo se o texto do banner mudar. */
export interface Consentimento {
  analytics: boolean;
  versao: number;
  data: string;
}

/**
 * Página da Política de Privacidade e Cookies (Strapi: page `politica-de-privacidade`).
 * Fica aqui (módulo comum), não no banner `'use client'`: Server Components (rodapé) também usam.
 */
export const ROTA_POLITICA = '/politica-de-privacidade';

/** Evento de janela para reabrir o banner (link "Preferências de cookies" no rodapé). */
export const EVENTO_ABRIR_BANNER = 'adai:abrir-preferencias-cookies';
/** Evento de janela disparado quando a escolha muda (o aviso de cookies se atualiza sozinho). */
export const EVENTO_CONSENTIMENTO_ALTERADO = 'adai:consentimento-alterado';

/**
 * Apaga os cookies do Google Analytics (`_ga`, `_ga_<id>`) no domínio atual e nos domínios-pai
 * (o GA4 grava no domínio mais alto possível, ex.: `.adai.com.br`). Não apaga dados já enviados.
 */
export function apagarCookiesAnalytics(): void {
  const nomes = document.cookie
    .split(';')
    .map((c) => c.split('=')[0].trim())
    .filter((nome) => nome === '_ga' || nome.startsWith('_ga_'));
  if (nomes.length === 0) return;
  const partes = window.location.hostname.split('.');
  const dominios = [''].concat(partes.map((_, i) => partes.slice(i).join('.')).filter((d) => d.includes('.')));
  for (const nome of nomes) {
    for (const dominio of dominios) {
      document.cookie = `${nome}=; Max-Age=0; path=/${dominio ? `; domain=.${dominio}` : ''}`;
    }
  }
}

export function lerConsentimento(): Consentimento | null {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE_CONSENTIMENTO) ?? 'null') as Consentimento | null;
    return salvo && typeof salvo.analytics === 'boolean' && salvo.versao === VERSAO_CONSENTIMENTO ? salvo : null;
  } catch {
    return null;
  }
}

/**
 * Salva a escolha, avisa o Consent Mode (`consent update`) e, no aceite, carrega o GTM pela
 * primeira vez. Recusar (inclusive depois de aceitar) nega analytics e apaga os cookies `_ga`;
 * o GTM já carregado obedece ao Consent Mode até a próxima página, que não o carrega mais.
 */
export function salvarConsentimento(analytics: boolean): void {
  const valor: Consentimento = { analytics, versao: VERSAO_CONSENTIMENTO, data: new Date().toISOString() };
  try {
    localStorage.setItem(CHAVE_CONSENTIMENTO, JSON.stringify(valor));
  } catch {
    // Navegação privada/armazenamento bloqueado: a escolha vale só nesta página.
  }
  window.dataLayer = window.dataLayer || [];
  // O GTM só entende comandos `gtag` no formato do objeto `arguments` (não um array comum).
  const comando = (function () {
    // eslint-disable-next-line prefer-rest-params -- o GTM exige o objeto `arguments` (formato do gtag)
    return arguments;
  } as (...valores: unknown[]) => IArguments)('consent', 'update', { analytics_storage: analytics ? 'granted' : 'denied' });
  window.dataLayer.push(comando as unknown as Record<string, unknown>);
  if (analytics) window.adaiCarregarGtm?.();
  else apagarCookiesAnalytics();
  window.dispatchEvent(new Event(EVENTO_CONSENTIMENTO_ALTERADO));
}
