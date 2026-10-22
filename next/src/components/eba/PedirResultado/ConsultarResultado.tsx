import { ButtonLink } from '@/components/ui/ButtonLink';
import styles from './ConsultarResultado.module.css';

/**
 * Faixa "Já fez os testes? Consultar meus resultados" no topo de `/eba/testes`. Leva ao pedido do
 * link (`/eba/resultado`). Fica no código, não no Strapi: só existe quando o recurso está ligado
 * (`EBA_RESULTADO_SEGREDO`), o que o editor não controla. Quem usa decide se mostra.
 */
export function ConsultarResultado() {
  return (
    <section className={styles.faixa} aria-labelledby="consultar-resultado-titulo" data-section="consultar-resultado">
      <div>
        <h2 id="consultar-resultado-titulo" className={styles.titulo}>
          Já fez os testes?
        </h2>
        <p className={styles.texto}>Receba por e-mail um link particular com o seu resultado.</p>
      </div>
      <ButtonLink href="/eba/resultado" estilo="contorno">
        Consultar meus resultados
      </ButtonLink>
    </section>
  );
}
