'use client';

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import styles from './Carrossel.module.css';

interface CarrosselProps {
  /** Nome do carrossel para leitores de tela (ex.: "Neste domingo"). */
  rotulo: string;
  total: number;
  /** Conteúdo extra na barra de controles (ex.: link "ver todos"). */
  acessorio?: ReactNode;
  /** Itens <li> já renderizados no servidor. */
  children: ReactNode;
  /** Classe da trilha (grade dos cards), definida pela seção. */
  trilhaClassName?: string;
}

function prefereMenosMovimento() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Trilha horizontal com setas. No fim, a seta "próximo" volta ao primeiro card; no início,
 * a seta "anterior" vai ao último (carrossel infinito com retorno). Rolagem suave + destaque
 * dos cards visíveis deixam claro o movimento; tudo desliga com prefers-reduced-motion.
 */
export function Carrossel({ rotulo, total, acessorio, children, trilhaClassName }: CarrosselProps) {
  const trilhaRef = useRef<HTMLUListElement>(null);
  const trilhaId = useId();
  const [progresso, setProgresso] = useState({ tamanho: 1, posicao: 0 });
  const [anuncio, setAnuncio] = useState('');

  const atualizarProgresso = useCallback(() => {
    const trilha = trilhaRef.current;
    if (!trilha) return;
    const tamanho = trilha.scrollWidth > 0 ? Math.min(1, trilha.clientWidth / trilha.scrollWidth) : 1;
    const max = trilha.scrollWidth - trilha.clientWidth;
    setProgresso({ tamanho, posicao: max > 0 ? trilha.scrollLeft / max : 0 });
  }, []);

  useEffect(() => {
    const trilha = trilhaRef.current;
    if (!trilha) return;
    atualizarProgresso();
    trilha.addEventListener('scroll', atualizarProgresso, { passive: true });

    const redimensionar = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(atualizarProgresso) : null;
    redimensionar?.observe(trilha);

    // Marca os cards visíveis: os parcialmente visíveis ficam esmaecidos e "entram" ao passar.
    const visibilidade =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entradas) => {
              for (const entrada of entradas) {
                (entrada.target as HTMLElement).dataset.visivel = String(entrada.intersectionRatio > 0.9);
              }
            },
            { root: trilha, threshold: [0, 0.9, 1] },
          )
        : null;
    trilha.querySelectorAll<HTMLElement>(':scope > li').forEach((item) => visibilidade?.observe(item));

    return () => {
      trilha.removeEventListener('scroll', atualizarProgresso);
      redimensionar?.disconnect();
      visibilidade?.disconnect();
    };
  }, [atualizarProgresso]);

  const mover = (direcao: 1 | -1) => {
    const trilha = trilhaRef.current;
    if (!trilha) return;
    const itens = trilha.querySelectorAll<HTMLElement>(':scope > li');
    if (itens.length === 0) return;

    const passo = itens.length > 1 ? itens[1].offsetLeft - itens[0].offsetLeft : itens[0].offsetWidth;
    const max = trilha.scrollWidth - trilha.clientWidth;
    const behavior: ScrollBehavior = prefereMenosMovimento() ? 'auto' : 'smooth';
    const noFim = trilha.scrollLeft >= max - 2;
    const noInicio = trilha.scrollLeft <= 2;

    let destino: number;
    if (direcao === 1 && noFim) destino = 0;
    else if (direcao === -1 && noInicio) destino = max;
    else destino = Math.min(max, Math.max(0, trilha.scrollLeft + direcao * passo));

    trilha.scrollTo({ left: destino, behavior });

    const primeiro = passo > 0 ? Math.round(destino / passo) + 1 : 1;
    const voltou = (direcao === 1 && noFim) || (direcao === -1 && noInicio);
    setAnuncio(`${voltou ? (direcao === 1 ? 'Voltando ao início. ' : 'Indo para o fim. ') : ''}Card ${Math.min(primeiro, total)} de ${total}.`);
  };

  return (
    <div className={styles.carrossel} data-total={total}>
      <div className={styles.controles}>
        {acessorio}
        <div className={styles.setas} role="group" aria-label={`Navegar em ${rotulo}`}>
          <button type="button" className={styles.seta} aria-controls={trilhaId} aria-label="Card anterior" onClick={() => mover(-1)}>
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
              <path d="M16 9H2M7 4 2 9l5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button type="button" className={styles.seta} aria-controls={trilhaId} aria-label="Próximo card" onClick={() => mover(1)}>
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
              <path d="M2 9h14M11 4l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <ul
        ref={trilhaRef}
        id={trilhaId}
        role="list"
        tabIndex={0}
        aria-label={`${rotulo}: ${total} ${total === 1 ? 'card' : 'cards'}`}
        className={`${styles.trilha} ${trilhaClassName ?? ''}`}
      >
        {children}
      </ul>

      <div className={styles.progresso} aria-hidden="true">
        <span
          className={styles.progressoBarra}
          style={{
            width: `${progresso.tamanho * 100}%`,
            transform: `translateX(${progresso.posicao * ((1 - progresso.tamanho) / progresso.tamanho) * 100}%)`,
          }}
        />
      </div>

      <p className="visually-hidden" aria-live="polite">
        {anuncio}
      </p>
    </div>
  );
}
