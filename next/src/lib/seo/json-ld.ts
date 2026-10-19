import { configuracaoSeo } from './site';

/** JSON para `<script type="application/ld+json">`: `<` vira `<` (não fecha o script no HTML). */
export function jsonLdSeguro(dados: object): string {
  return JSON.stringify(dados).replace(/</g, '\\u003c');
}

/** Origem do site para URLs absolutas dos dados estruturados (localhost fora de produção). */
export function origemDoSite(): string {
  return configuracaoSeo().url ?? 'http://localhost:3000';
}
