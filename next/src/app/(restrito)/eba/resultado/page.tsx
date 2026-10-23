import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PedirResultado } from '@/components/eba/PedirResultado/PedirResultado';
import { Trilha, type TrilhaItem } from '@/components/ui/Trilha';
import { schemaDaTrilha } from '@/lib/eba/dados-estruturados';
import { segredoDoResultado } from '@/lib/eba/link-resultado';
import { jsonLdSeguro, origemDoSite } from '@/lib/seo/json-ld';
import { confirmarLinkResultado, pedirCodigoResultado, reenviarLinkResultado } from './acoes';
import estilosEba from '@/app/(site)/eba/eba.module.css';
import styles from './resultado.module.css';

/** Tela de ação, não de conteúdo: `noindex, nofollow` e fora do sitemap. */
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Receber meu resultado — Testes da EBA | ADAI',
    robots: { index: false, follow: false },
  };
}

/**
 * /eba/resultado — pedido do link do resultado (e-mail → código → link por e-mail). Desligada por
 * padrão: sem `EBA_RESULTADO_SEGREDO` responde 404, como `/eba/resultado/<codigo>`.
 */
export default function PedirResultadoPage() {
  if (!segredoDoResultado()) notFound();
  const trilha: TrilhaItem[] = [
    { texto: 'ADAI', href: '/' },
    { texto: 'EBA', href: '/eba' },
    { texto: 'Testes', href: '/eba/testes' },
    { texto: 'Receber meu resultado' },
  ];
  return (
    <>
      <script type="application/ld+json">{jsonLdSeguro(schemaDaTrilha(trilha, origemDoSite()))}</script>
      <div className={estilosEba.trilha}>
        <Trilha itens={trilha} />
      </div>
      <section className={styles.tela} aria-label="Receber meu resultado" data-section="pedir-resultado-eba">
        <div className={styles.caixa}>
          <PedirResultado acoes={{ pedirCodigo: pedirCodigoResultado, confirmar: confirmarLinkResultado, reenviar: reenviarLinkResultado }} />
        </div>
      </section>
    </>
  );
}
