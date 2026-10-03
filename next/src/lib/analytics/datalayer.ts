import type { EventosAnalytics, NomeEvento } from './eventos';
import { getAmbiente } from './gtm';

declare global {
  interface Window {
    /** Fila do Google Tag Manager. */
    dataLayer?: Record<string, unknown>[];
  }
}

/** GA4 corta valores de parâmetro em 100 caracteres. */
const MAX_VALOR = 100;

/**
 * Padroniza texto para relatório: sem acento, minúsculo, espaços simples, ≤ 100 caracteres
 * ("Anália  Franco" e "anália franco" viram o mesmo valor). Números passam intactos.
 */
export function normalizarValor(valor: unknown): unknown {
  if (typeof valor !== 'string') return valor;
  return valor
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_VALOR);
}

function idDoEvento(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Envia um evento do catálogo ao `dataLayer`. Só no navegador; parâmetros vazios são omitidos.
 * Campos comuns (não sobrescrevíveis): `event_id` (deduplicação), `page_location` (sem query string), `page_path`
 * e `site_ambiente` (producao | homologacao). O que o GTM faz com o evento depende do
 * consentimento (Consent Mode): empurrar para a fila não grava cookie.
 */
export function registrarEvento<N extends NomeEvento>(nome: N, parametros: EventosAnalytics[N]): void {
  if (typeof window === 'undefined') return;
  const limpos = Object.fromEntries(
    Object.entries(parametros as Record<string, unknown>)
      .map(([chave, valor]) => [chave, normalizarValor(valor)])
      .filter(([, valor]) => valor !== undefined && valor !== null && valor !== ''),
  );
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: nome,
    ...limpos,
    event_id: idDoEvento(),
    // Sem `?…` e `#…`: parâmetros de URL podem carregar dados pessoais (Política de Privacidade).
    page_location: `${window.location.origin}${window.location.pathname}`,
    page_path: window.location.pathname,
    site_ambiente: getAmbiente(),
  });
}
