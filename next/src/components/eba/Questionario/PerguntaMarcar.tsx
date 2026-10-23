import type { RefCallback } from 'react';
import styles from './Questionario.module.css';

export interface PerguntaMarcarProps {
  nome: string;
  legenda: string;
  ajuda: string;
  opcoes: { id: number; texto: string }[];
  marcadas: number[];
  onAlternar: (id: number) => void;
  /** Opção que não pode ser marcada agora (ex.: 4ª escolha dos talentos). */
  bloqueada?: (id: number) => boolean;
  legendaRef: RefCallback<HTMLElement>;
}

/** Lista de checkboxes nativos (Talentos e Temperamento). */
export function PerguntaMarcar({ nome, legenda, ajuda, opcoes, marcadas, onAlternar, bloqueada, legendaRef }: PerguntaMarcarProps) {
  return (
    <fieldset className={styles.pergunta}>
      <legend ref={legendaRef} tabIndex={-1} className={styles.enunciado}>
        {legenda}
      </legend>
      <p className={styles.dica} aria-live="polite">
        {ajuda}
      </p>
      <ul role="list" className={styles.listaMarcar}>
        {opcoes.map((opcao) => {
          const marcada = marcadas.includes(opcao.id);
          return (
            <li key={opcao.id}>
              <label className={styles.marcar}>
                <input
                  type="checkbox"
                  name={nome}
                  value={opcao.id}
                  checked={marcada}
                  disabled={!marcada && Boolean(bloqueada?.(opcao.id))}
                  onChange={() => onAlternar(opcao.id)}
                />
                <span>{opcao.texto}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
