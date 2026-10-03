'use client';

import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { buttonClassName } from '@/components/ui/ButtonLink';
import { SmartLink } from '@/components/ui/SmartLink';
import {
  EVENTO_ABRIR_BANNER,
  EVENTO_CONSENTIMENTO_ALTERADO,
  lerConsentimento,
  ROTA_POLITICA,
  salvarConsentimento,
} from '@/lib/analytics/consentimento';
import { registrarEvento } from '@/lib/analytics/datalayer';
import styles from './BannerCookies.module.css';

/** A escolha vive no navegador: muda quando a pessoa escolhe aqui ou em outra aba. */
function assinarConsentimento(avisar: () => void): () => void {
  window.addEventListener(EVENTO_CONSENTIMENTO_ALTERADO, avisar);
  window.addEventListener('storage', avisar);
  return () => {
    window.removeEventListener(EVENTO_CONSENTIMENTO_ALTERADO, avisar);
    window.removeEventListener('storage', avisar);
  };
}

const temEscolhaNoNavegador = () => lerConsentimento() !== null;
/** No servidor não há escolha para ler: o aviso só aparece depois da hidratação (sem flash). */
const temEscolhaNoServidor = () => true;

interface BannerCookiesProps {
  /** Vitrine: sempre visível, fora da posição fixa e sem ler/gravar a escolha. */
  demonstracao?: boolean;
}

/**
 * Aviso de cookies próprio (LGPD). Aparece até a pessoa escolher; a escolha fica no navegador
 * e alimenta o Consent Mode do GTM (sem aceite, o GA4 não grava cookies). Reabre pelo botão
 * "Preferências de cookies" do rodapé. Não é modal: não bloqueia a página nem prende o foco.
 */
export function BannerCookies({ demonstracao = false }: BannerCookiesProps) {
  const temEscolha = useSyncExternalStore(assinarConsentimento, temEscolhaNoNavegador, temEscolhaNoServidor);
  const [reaberto, setReaberto] = useState(false);
  const [demonstracaoFechada, setDemonstracaoFechada] = useState(false);
  const regiaoRef = useRef<HTMLElement>(null);
  const tituloId = useId();

  useEffect(() => {
    if (demonstracao) return;
    const reabrir = () => {
      setReaberto(true);
      // Quem reabriu pelo rodapé (teclado) vai direto para o aviso.
      requestAnimationFrame(() => regiaoRef.current?.focus());
    };
    window.addEventListener(EVENTO_ABRIR_BANNER, reabrir);
    return () => window.removeEventListener(EVENTO_ABRIR_BANNER, reabrir);
  }, [demonstracao]);

  const visivel = demonstracao ? !demonstracaoFechada : reaberto || !temEscolha;
  if (!visivel) return null;

  const escolher = (analytics: boolean) => {
    if (demonstracao) {
      setDemonstracaoFechada(true);
      return;
    }
    salvarConsentimento(analytics);
    registrarEvento('consentimento_cookies', { escolha: analytics ? 'aceito' : 'recusado' });
    setReaberto(false);
  };

  return (
    <section
      ref={regiaoRef}
      tabIndex={-1}
      aria-labelledby={tituloId}
      className={demonstracao ? `${styles.banner} ${styles.estatico}` : styles.banner}
      data-analytics="manual"
    >
      <h2 id={tituloId} className={styles.titulo}>
        Sua privacidade
      </h2>
      <p className={styles.texto}>
        Guardamos sua escolha de privacidade no navegador. Com sua autorização, usamos cookies de análise do Google
        Analytics para entender a navegação e melhorar o site. Você pode aceitar, recusar ou rever sua escolha em
        “Preferências de cookies”. Saiba mais na nossa{' '}
        <SmartLink href={ROTA_POLITICA} className={styles.linkPolitica}>
          Política de Privacidade e Cookies
        </SmartLink>
        .
      </p>
      <div className={styles.acoes}>
        <button type="button" className={buttonClassName({ superficie: 'escura', tamanho: 'sm', className: styles.botao })} onClick={() => escolher(true)}>
          Aceitar
        </button>
        <button
          type="button"
          className={buttonClassName({ estilo: 'contorno', superficie: 'escura', tamanho: 'sm', className: styles.botao })}
          onClick={() => escolher(false)}
        >
          Recusar
        </button>
      </div>
    </section>
  );
}
