import { useEffect, useState } from 'react';
import styles from './Questionario.module.css';

/** Depois disso, uma ação em andamento ganha o aviso de API fria. */
export const ESPERA_LONGA_MS = 5_000;
export const TEXTO_ESPERA = 'A primeira conexão do dia pode levar até um minuto. Aguarde, por favor.';

/**
 * `true` quando `ativo` está ligado há mais de 5 s (o banco da API pausa quando fica ocioso e a
 * primeira chamada leva até 45 s). Volta a `false` assim que `ativo` desliga.
 */
export function useEsperaLonga(ativo: boolean): boolean {
  const [longa, setLonga] = useState(false);
  useEffect(() => {
    if (!ativo) return;
    const timer = setTimeout(() => setLonga(true), ESPERA_LONGA_MS);
    return () => {
      clearTimeout(timer);
      setLonga(false);
    };
  }, [ativo]);
  return ativo && longa;
}

/** O texto do aviso, para ir dentro de uma região `role="status"` que já existe. */
export function TextoEspera({ visivel }: { visivel: boolean }) {
  return visivel ? <p className={styles.texto}>{TEXTO_ESPERA}</p> : null;
}

/**
 * Região `role="status"` própria (identificação e cadastro): existe enquanto a ação está em
 * andamento, vazia, e o texto entra depois de 5 s (assim o leitor de tela anuncia).
 */
export function AvisoDeEspera({ ativo }: { ativo: boolean }) {
  const longa = useEsperaLonga(ativo);
  if (!ativo) return null;
  return (
    <div role="status" className={styles.espera}>
      <TextoEspera visivel={longa} />
    </div>
  );
}
