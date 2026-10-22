import { TESTES, type SlugTeste } from '@/lib/eba-api/testes';

/**
 * QR codes impressos dos 5 testes (imagens copiadas do site atual, `adaitech/eba-adai`,
 * `public/assets/qr/`, em `public/eba/qr/`). Cada imagem leva ao endereço do site atual
 * (`https://eba.adai.com.br/teste/<slug>`, conferido decodificando os cinco arquivos). Depois da virada
 * esse site redireciona `/teste/<slug>` para `/eba/testes/<slug>` no Hub (spec da entrega 2), então o QR
 * impresso continua valendo sem reimpressão.
 */
export const ORIGEM_DO_SITE_ATUAL = 'https://eba.adai.com.br';

export interface QrDoTeste {
  slug: SlugTeste;
  /** Caminho da imagem em `public/`. */
  imagem: string;
  /** Endereço que o QR impresso abre. */
  enderecoDoQr: string;
}

export const QR_CODES: readonly QrDoTeste[] = TESTES.map((teste) => ({
  slug: teste.slug,
  imagem: `/eba/qr/${teste.slug}.jpeg`,
  enderecoDoQr: `${ORIGEM_DO_SITE_ATUAL}/teste/${teste.slug}`,
}));

/** Endereço do teste no Hub (o que vale depois da virada), para copiar e enviar. */
export function enderecoDoHub(slug: SlugTeste, origem: string): string {
  return `${origem.replace(/\/+$/, '')}/eba/testes/${slug}`;
}
