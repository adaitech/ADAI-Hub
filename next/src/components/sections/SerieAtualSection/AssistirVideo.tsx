'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { VideoSerie } from '@/lib/youtube/serie';
import styles from './AssistirVideo.module.css';

interface AssistirVideoProps {
  video: VideoSerie;
  /** Nome do vídeo no player (título do dialog e do iframe). */
  titulo: string;
  /** Nome acessível do gatilho, quando o conteúdo visível não basta (ex.: só a thumbnail). */
  rotulo?: string;
  className?: string;
  children: ReactNode;
}

/**
 * Gatilho + player do YouTube dentro do site (dialog nativo, modal). Nada do player existe na
 * página até o clique: o dialog e o iframe são criados ao abrir (portal no <body>, o que também
 * permite usar o gatilho dentro de um título) e removidos ao fechar.
 * Vídeo que não permite incorporação (`embeddable: false`) vira link direto para o YouTube.
 */
export function AssistirVideo({ video, titulo, rotulo, className, children }: AssistirVideoProps) {
  const gatilhoRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    if (aberto && dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal();
  }, [aberto]);

  if (!video.embeddable) {
    return (
      <a
        href={video.youtubeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        aria-label={rotulo && `${rotulo} (abre no YouTube)`}
      >
        {children}
        {!rotulo && <span className="visually-hidden"> (abre no YouTube)</span>}
      </a>
    );
  }

  const fechar = () => {
    setAberto(false);
    gatilhoRef.current?.focus();
  };

  return (
    <>
      <button
        ref={gatilhoRef}
        type="button"
        className={className}
        aria-haspopup="dialog"
        aria-label={rotulo}
        onClick={() => setAberto(true)}
      >
        {children}
      </button>
      {aberto &&
        createPortal(
          <dialog
            ref={dialogRef}
            className={styles.dialog}
            aria-label={titulo}
            onClose={fechar}
            onClick={(event) => {
              // Clique no fundo escurecido (fora do conteúdo) fecha.
              if (event.target === event.currentTarget) dialogRef.current?.close();
            }}
          >
            <div className={styles.conteudo}>
              <div className={styles.topo}>
                <p className={styles.titulo}>{titulo}</p>
                <button type="button" className={styles.fechar} onClick={() => dialogRef.current?.close()}>
                  Fechar<span className="visually-hidden"> o vídeo</span>
                </button>
              </div>
              <div className={styles.player}>
                <iframe
                  src={`${video.embedUrl}?autoplay=1&rel=0`}
                  title={titulo}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
              <a href={video.youtubeUrl} target="_blank" rel="noopener noreferrer" className={styles.youtube}>
                Assistir no YouTube<span className="visually-hidden"> (abre em nova aba)</span>
              </a>
            </div>
          </dialog>,
          document.body,
        )}
    </>
  );
}
