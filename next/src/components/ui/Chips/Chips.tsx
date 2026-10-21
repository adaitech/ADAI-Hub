import clsx from 'clsx';
import type { ChipView } from '@/lib/eba/types';
import styles from './Chips.module.css';

export interface ChipsProps {
  itens: ChipView[];
  /** Fundo onde a lista está. */
  tom?: 'claro' | 'inverso';
  className?: string;
}

/** Informações curtas com rótulo visível ("Para quem", "Duração"…). Lista, não só cor. */
export function Chips({ itens, tom = 'claro', className }: ChipsProps) {
  if (itens.length === 0) return null;
  return (
    <ul role="list" className={clsx(styles.chips, styles[tom], className)}>
      {itens.map((item) => (
        <li key={item.rotulo} className={styles.chip}>
          <span className={styles.rotulo}>{item.rotulo}</span>
          <span>{item.valor}</span>
        </li>
      ))}
    </ul>
  );
}
