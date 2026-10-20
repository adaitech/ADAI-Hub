import type { RefCallback } from 'react';
import { ESCALA_NOTA } from '@/lib/eba-api/testes';
import styles from './Questionario.module.css';

export interface PerguntaNotaProps {
  /** `name` do grupo de radios (único por pergunta). */
  nome: string;
  texto: string;
  valor: number | undefined;
  onEscolher: (nota: number) => void;
  legendaRef: RefCallback<HTMLElement>;
}

/** Afirmação com a escala 0–5 em radios nativos. Nome acessível de cada opção: "N — Rótulo". */
export function PerguntaNota({ nome, texto, valor, onEscolher, legendaRef }: PerguntaNotaProps) {
  return (
    <fieldset className={styles.pergunta}>
      <legend ref={legendaRef} tabIndex={-1} className={styles.enunciado}>
        {texto}
      </legend>
      <p className={styles.dica}>Isso tem sido a sua experiência?</p>
      <ul role="list" className={styles.opcoes}>
        {ESCALA_NOTA.map((opcao) => (
          <li key={opcao.valor}>
            <label className={styles.opcao}>
              <input type="radio" name={nome} value={opcao.valor} checked={valor === opcao.valor} onChange={() => onEscolher(opcao.valor)} />
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
