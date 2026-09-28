'use client';

import { useEffect, useRef, useState } from 'react';
import { PREVIEW_DADOS_MESSAGE, PREVIEW_HEIGHT_MESSAGE } from './PreviewHeight';
import styles from './vitrine-parts.module.css';

const LARGURAS = [
  { valor: 375, rotulo: 'Celular · 375' },
  { valor: 768, rotulo: 'Tablet · 768' },
  { valor: 1440, rotulo: 'Computador · 1440' },
];

interface ViewportFrameProps {
  src: string;
  titulo: string;
  /** Recebe o JSON que o preview renderizou (com os controles aplicados). */
  onDados?: (dados: unknown) => void;
}

/** Pré-visualização em iframe com largura real de celular, tablet e computador (mobile-first). */
export function ViewportFrame({ src, titulo, onDados }: ViewportFrameProps) {
  const [largura, setLargura] = useState(375);
  const [altura, setAltura] = useState(320);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const onDadosRef = useRef(onDados);

  useEffect(() => {
    onDadosRef.current = onDados;
  }, [onDados]);

  useEffect(() => {
    const receber = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (event.data?.type === PREVIEW_HEIGHT_MESSAGE) setAltura(Math.ceil(event.data.altura));
      if (event.data?.type === PREVIEW_DADOS_MESSAGE) onDadosRef.current?.(event.data.dados);
    };
    window.addEventListener('message', receber);
    return () => window.removeEventListener('message', receber);
  }, []);

  return (
    <div className={styles.frame}>
      <div className={styles.controles} role="group" aria-label={`Largura da pré-visualização: ${titulo}`}>
        {LARGURAS.map(({ valor, rotulo }) => (
          <button
            key={valor}
            type="button"
            className={styles.largura}
            aria-pressed={largura === valor}
            onClick={() => setLargura(valor)}
          >
            {rotulo}
          </button>
        ))}
        <a href={src} target="_blank" rel="noopener noreferrer" className={styles.abrir}>
          Abrir sozinho<span className="visually-hidden"> (abre em nova aba)</span>
        </a>
      </div>
      {/* Rolável no celular (iframe mais largo que a tela): focável para rolar pelo teclado. */}
      <div className={styles.moldura} tabIndex={0} role="region" aria-label={`Pré-visualização: ${titulo}`}>
        <iframe
          ref={iframeRef}
          src={src}
          title={`${titulo} — ${largura}px`}
          className={styles.iframe}
          style={{ width: largura, height: altura }}
          loading="lazy"
        />
      </div>
    </div>
  );
}
