import { QrCodes } from '@/components/eba/Equipe/QrCodes';
import styles from '@/components/eba/Equipe/Equipe.module.css';
import { exigirSessaoDaEquipe } from '@/lib/eba/equipe/servidor';
import { QR_CODES } from '@/lib/eba/qr-codes';
import { origemDoSite } from '@/lib/seo/json-ld';

/** /eba/equipe/qr-codes — os 5 QR codes impressos dos testes, com os endereços e o link do Hub para copiar. */
export default async function QrCodesPage() {
  await exigirSessaoDaEquipe();
  return (
    <section className={styles.secao} aria-labelledby="qr-titulo" data-section="equipe-qr-codes">
      <h1 id="qr-titulo" className={styles.titulo}>
        QR codes dos testes
      </h1>
      <QrCodes qrCodes={QR_CODES} origemDoHub={origemDoSite()} />
    </section>
  );
}
