import Image from 'next/image';
import { CopyButton } from '@/components/ui/CopyButton/CopyButton';
import { enderecoDoHub, type QrDoTeste } from '@/lib/eba/qr-codes';
import { definicaoDoTeste } from '@/lib/eba-api/testes';
import styles from './Equipe.module.css';

export interface QrCodesProps {
  qrCodes: readonly QrDoTeste[];
  /** Origem do Hub (`https://adai.com.br`), para montar o endereço de cada teste. */
  origemDoHub: string;
}

/**
 * QR codes impressos dos testes, para a equipe baixar ou conferir. A imagem não é otimizada (`unoptimized`):
 * recompressão borraria o código. Os dois endereços ficam visíveis (o do QR e o do Hub) para cópia manual.
 */
export function QrCodes({ qrCodes, origemDoHub }: QrCodesProps) {
  return (
    <div className={styles.secao}>
      <p className={styles.vazio}>
        Cada QR code impresso abre o endereço do site atual da EBA. Depois da virada, o site atual redireciona para o Hub, então os QR codes já
        impressos continuam valendo.
      </p>
      <ul role="list" className={styles.qrLista}>
        {qrCodes.map((qr) => {
          const nome = definicaoDoTeste(qr.slug)?.nome ?? qr.slug;
          return (
            <li key={qr.slug} className={styles.qrCartao}>
              <h2 className={styles.linha}>{nome}</h2>
              <Image src={qr.imagem} alt={`QR code do teste ${nome}`} width={160} height={160} unoptimized />
              <dl className={styles.dados}>
                <div>
                  <dt>Endereço do QR (site atual)</dt>
                  <dd>{qr.enderecoDoQr}</dd>
                </div>
                <div>
                  <dt>Endereço no Hub</dt>
                  <dd>{enderecoDoHub(qr.slug, origemDoHub)}</dd>
                </div>
              </dl>
              <CopyButton valor={enderecoDoHub(qr.slug, origemDoHub)} rotulo="Copiar link do Hub" />
              <a href={qr.imagem} target="_blank" rel="noopener noreferrer">
                Abrir a imagem do QR code<span className="visually-hidden"> de {nome} (abre em nova aba)</span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
