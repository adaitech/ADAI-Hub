import type { RefCallback } from 'react';
import type { ParEstilo } from '@/lib/eba-api/conteudo-local';
import { useEscolhaPorPonteiro } from './PerguntaNota';
import styles from './Questionario.module.css';

export interface PerguntaEstiloProps {
  nome: string;
  par: ParEstilo;
  valor: number | undefined;
  onEscolher: (nota: number) => void;
  /** Só depois de uma escolha com ponteiro (ver `useEscolhaPorPonteiro`). */
  onAvancar: () => void;
  legendaRef: RefCallback<HTMLElement>;
}

/** Nome acessível completo de cada ponto da escala 1–5 (o número sozinho não diz nada). */
function rotulo(valor: number, par: ParEstilo): string {
  switch (valor) {
    case 1:
      return `1 — mais perto de: ${par.esquerda}`;
    case 2:
      return `2 — um pouco mais perto de: ${par.esquerda}`;
    case 3:
      return '3 — entre as duas';
    case 4:
      return `4 — um pouco mais perto de: ${par.direita}`;
    default:
      return `5 — mais perto de: ${par.direita}`;
  }
}

const ESCALA = [1, 2, 3, 4, 5];

/** Par de frases do Estilo pessoal: 1 = totalmente a da esquerda, 5 = totalmente a da direita. */
export function PerguntaEstilo({ nome, par, valor, onEscolher, onAvancar, legendaRef }: PerguntaEstiloProps) {
  const { aoApertar, aoClicar } = useEscolhaPorPonteiro(onAvancar);
  return (
    <fieldset className={styles.pergunta}>
      <legend ref={legendaRef} tabIndex={-1} className={styles.enunciado}>
        {`${par.titulo}…`}
      </legend>
      <div className={styles.par} aria-hidden="true">
        <span>{par.esquerda}</span>
        <span>{par.direita}</span>
      </div>
      <ul role="list" className={`${styles.opcoes} ${styles.opcoesEstilo}`}>
        {ESCALA.map((n) => (
          <li key={n}>
            <label className={`${styles.opcao} ${styles.opcaoEstilo}`} onPointerDown={aoApertar}>
              <input type="radio" name={nome} value={n} checked={valor === n} onChange={() => onEscolher(n)} onClick={aoClicar} />
              <span className={styles.opcaoNumero} aria-hidden="true">
                {n}
              </span>
              <span className="visually-hidden">{rotulo(n, par)}</span>
            </label>
          </li>
        ))}
      </ul>
      <p className={styles.dica}>1 = totalmente a frase da esquerda · 5 = totalmente a da direita</p>
    </fieldset>
  );
}
