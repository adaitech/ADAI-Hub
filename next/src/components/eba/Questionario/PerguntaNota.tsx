import { useRef, type MouseEvent, type RefCallback } from 'react';
import { ESCALA_NOTA } from '@/lib/eba-api/testes';
import styles from './Questionario.module.css';

export interface PerguntaNotaProps {
  /** `name` do grupo de radios (único por pergunta). */
  nome: string;
  texto: string;
  valor: number | undefined;
  /** Registra a nota (mouse, toque ou teclado). */
  onEscolher: (nota: number) => void;
  /** Vai para a próxima pergunta: só depois de uma escolha com ponteiro. */
  onAvancar: () => void;
  legendaRef: RefCallback<HTMLElement>;
}

/**
 * Escolher com mouse ou toque avança; com o teclado (setas, espaço) só registra, para a pessoa
 * percorrer a escala sem pular de pergunta (WCAG 2.1.1 e 3.2.2) e seguir por "Próxima pergunta".
 * Ponteiro = `pointerdown` no rótulo ou clique com `detail > 0` (setas geram clique com detail 0).
 */
export function useEscolhaPorPonteiro(onAvancar: () => void) {
  const ponteiro = useRef(false);
  return {
    aoApertar: () => {
      ponteiro.current = true;
    },
    aoClicar: (evento: MouseEvent) => {
      const comPonteiro = ponteiro.current || evento.detail > 0;
      ponteiro.current = false;
      if (comPonteiro) onAvancar();
    },
  };
}

/** Afirmação com a escala 0–5 em radios nativos. Nome acessível de cada opção: "N — Rótulo". */
export function PerguntaNota({ nome, texto, valor, onEscolher, onAvancar, legendaRef }: PerguntaNotaProps) {
  const { aoApertar, aoClicar } = useEscolhaPorPonteiro(onAvancar);
  return (
    <fieldset className={styles.pergunta}>
      <legend ref={legendaRef} tabIndex={-1} className={styles.enunciado}>
        {texto}
      </legend>
      <p className={styles.dica}>Isso tem sido a sua experiência?</p>
      <ul role="list" className={styles.opcoes}>
        {ESCALA_NOTA.map((opcao) => (
          <li key={opcao.valor}>
            <label className={styles.opcao} onPointerDown={aoApertar}>
              <input type="radio" name={nome} value={opcao.valor} checked={valor === opcao.valor} onChange={() => onEscolher(opcao.valor)} onClick={aoClicar} />
              <span className={styles.opcaoNumero} aria-hidden="true">
                {opcao.valor}
              </span>
              <span aria-hidden="true">{opcao.rotulo}</span>
              <span className="visually-hidden">{`${opcao.valor} — ${opcao.rotulo}`}</span>
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}
