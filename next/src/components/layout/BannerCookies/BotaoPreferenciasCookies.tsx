'use client';

import { EVENTO_ABRIR_BANNER } from '@/lib/analytics/consentimento';
import styles from './BannerCookies.module.css';

/** "Preferências de cookies" no rodapé: reabre o aviso para mudar a escolha a qualquer momento (LGPD). */
export function BotaoPreferenciasCookies() {
  return (
    <button type="button" className={styles.preferencias} onClick={() => window.dispatchEvent(new Event(EVENTO_ABRIR_BANNER))}>
      Preferências de cookies
    </button>
  );
}
