'use client';

import Image from 'next/image';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { FotoEvento } from '@/lib/inchurch/types';
import layout from './EventoDetalhe.module.css';
import styles from './GaleriaEvento.module.css';

/** Dialog nativo, como o player existente; só a imagem selecionada é montada no lightbox. */
export function GaleriaEvento({ imagens, nomeEvento }: { imagens: FotoEvento[]; nomeEvento: string }) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const fecharRef = useRef<HTMLButtonElement>(null);
  const gatilho = useRef<HTMLButtonElement | null>(null);
  const [indice, setIndice] = useState<number | null>(null);
  const aberto = indice !== null;
  const foto = indice === null ? null : imagens[indice];

  useEffect(() => {
    if (!aberto) return;
    const raiz = document.documentElement.style.overflow;
    const corpo = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    if (dialog.current && !dialog.current.open) dialog.current.showModal();
    fecharRef.current?.focus();
    return () => {
      document.documentElement.style.overflow = raiz;
      document.body.style.overflow = corpo;
    };
  }, [aberto]);

  const fechar = () => {
    if (dialog.current?.open) dialog.current.close();
    setIndice(null);
    gatilho.current?.focus();
  };
  const navegar = (passo: number) => setIndice((atual) => atual === null ? null : (atual + passo + imagens.length) % imagens.length);
  const otimizada = (url: string) => url.startsWith('https://storage.googleapis.com/media_files_prod/');

  if (!imagens.length) return null;
  return <section className={layout.convidados} aria-labelledby={`${id}-titulo`} data-section="galeria-evento">
    <h2 id={`${id}-titulo`} className={layout.titulo}>Galeria do evento</h2>
    <ul className={styles.grade} role="list">
      {imagens.map((imagem, i) => <li key={imagem.id}>
        <button type="button" className={styles.miniatura} aria-label={`Ampliar foto ${i + 1} de ${nomeEvento}`} aria-haspopup="dialog" onClick={(event) => { gatilho.current = event.currentTarget; setIndice(i); }}>
          <Image src={imagem.miniatura} alt={`Foto ${i + 1} de ${nomeEvento}`} fill sizes="(min-width: 1024px) 30vw, (min-width: 769px) 45vw, 100vw" unoptimized={!otimizada(imagem.miniatura)} />
        </button>
      </li>)}
    </ul>
    {foto && createPortal(<dialog ref={dialog} className={styles.dialog} aria-labelledby={`${id}-modal`} aria-describedby={`${id}-contador`} data-section="galeria-evento"
      onClose={fechar} onCancel={(event) => { event.preventDefault(); fechar(); }}
      onClick={(event) => { if (event.target === event.currentTarget) fechar(); }}
      onKeyDown={(event) => {
        if (event.key === 'Tab') {
          const botoes = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not([disabled])'));
          const primeiro = botoes[0];
          const ultimo = botoes.at(-1);
          if (event.shiftKey && document.activeElement === primeiro) { event.preventDefault(); ultimo?.focus(); }
          else if (!event.shiftKey && document.activeElement === ultimo) { event.preventDefault(); primeiro?.focus(); }
          return;
        }
        if (imagens.length < 2) return;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); navegar(event.key === 'ArrowLeft' ? -1 : 1); }
      }}>
      <div className={styles.topo}>
        <p id={`${id}-modal`}>Galeria de {nomeEvento}</p>
        <button ref={fecharRef} type="button" className={styles.controle} onClick={fechar}>Fechar<span className="visually-hidden"> galeria</span></button>
      </div>
      <div className={styles.palco}>
        <Image key={foto.id} src={foto.imagem} alt={`Foto ${indice! + 1} de ${nomeEvento}`} fill sizes="95vw" unoptimized={!otimizada(foto.imagem)} className={styles.ampliada} />
      </div>
      <div className={styles.navegacao}>
        {imagens.length > 1 && <button type="button" className={styles.controle} aria-label="Foto anterior" onClick={() => navegar(-1)}>Anterior</button>}
        <p id={`${id}-contador`} role="status" aria-live="polite">Foto {indice! + 1} de {imagens.length}</p>
        {imagens.length > 1 && <button type="button" className={styles.controle} aria-label="Próxima foto" onClick={() => navegar(1)}>Próxima</button>}
      </div>
    </dialog>, document.body)}
  </section>;
}
