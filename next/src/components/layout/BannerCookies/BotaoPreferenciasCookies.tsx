'use client';

import type { ReactNode } from 'react';
import { EVENTO_ABRIR_BANNER } from '@/lib/analytics/consentimento';
import styles from './BannerCookies.module.css';

/**
 * "Preferências de cookies": reabre o aviso para mudar a escolha a qualquer momento (LGPD).
 * Fica na Política de Privacidade (link `#preferencias-cookies` no Markdown do Strapi).
 */
export function BotaoPreferenciasCookies({ children = 'Preferências de cookies' }: { children?: ReactNode }) {
  return (
    <button type="button" className={styles.preferencias} onClick={() => window.dispatchEvent(new Event(EVENTO_ABRIR_BANNER))}>
      {children}
    </button>
  );
}
