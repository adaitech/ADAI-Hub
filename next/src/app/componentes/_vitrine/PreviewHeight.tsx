'use client';

import { useEffect } from 'react';

export const PREVIEW_HEIGHT_MESSAGE = 'adai-preview-altura';
export const PREVIEW_DADOS_MESSAGE = 'adai-preview-dados';

interface PreviewHeightProps {
  /** JSON renderizado (já com os controles aplicados), mostrado pela vitrine abaixo do iframe. */
  dados?: unknown;
}

/** Informa ao iframe pai a altura do conteúdo (moldura sem barra de rolagem) e o JSON renderizado. */
export function PreviewHeight({ dados }: PreviewHeightProps) {
  useEffect(() => {
    if (window.parent === window) return;
    const enviar = () =>
      window.parent.postMessage(
        { type: PREVIEW_HEIGHT_MESSAGE, altura: document.documentElement.scrollHeight },
        window.location.origin,
      );
    const observer = new ResizeObserver(enviar);
    observer.observe(document.body);
    enviar();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (window.parent === window || dados === undefined) return;
    window.parent.postMessage({ type: PREVIEW_DADOS_MESSAGE, dados }, window.location.origin);
  }, [dados]);

  return null;
}
