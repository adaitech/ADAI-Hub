'use client';

import { useState } from 'react';
import { registrarEvento } from '@/lib/analytics/datalayer';
import { buttonClassName } from '../ButtonLink/ButtonLink';
import styles from './CopyButton.module.css';

export interface CopyButtonProps {
  valor: string;
  rotulo: string;
  /** A seção escolhe a finalidade; o valor copiado nunca entra na medição. */
  conversao?: 'pix';
}

/** A origem mantém o valor visível para permitir cópia manual sem a Clipboard API. */
export function CopyButton({ valor, rotulo, conversao }: CopyButtonProps) {
  const [mensagem, setMensagem] = useState('');
  const [copiando, setCopiando] = useState(false);

  async function copiar() {
    setMensagem('');
    setCopiando(true);
    try {
      await navigator.clipboard.writeText(valor);
      if (conversao === 'pix') registrarEvento('contribuir', { origem: 'pix', texto: rotulo });
      setMensagem('Copiado!');
    } catch {
      setMensagem('Não foi possível copiar. Selecione e copie o valor acima.');
    } finally {
      setCopiando(false);
    }
  }

  return (
    <div className={styles.grupo}>
      <button type="button" className={buttonClassName()} onClick={copiar} disabled={copiando}>{rotulo}</button>
      <p role="status" className={styles.status}>{mensagem}</p>
    </div>
  );
}
