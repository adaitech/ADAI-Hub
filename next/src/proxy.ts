import { NextResponse, type NextRequest } from 'next/server';
import { cabecalhosDaPagina, gerarNonce, lerConfigSeguranca } from '@/lib/seguranca/cabecalhos';

/**
 * CSP com nonce por requisição (guia de CSP do Next 16). O Next lê o nonce da CSP do pedido e o
 * aplica nos próprios scripts; componentes leem `x-nonce` (ex.: GoogleTagManager).
 * Cabeçalhos fixos (HSTS, nosniff...) ficam no `next.config.ts`. Padrão: `lib/seguranca/cabecalhos.ts`.
 */
export function proxy(request: NextRequest) {
  const nonce = gerarNonce();
  const cabecalhos = cabecalhosDaPagina(nonce, lerConfigSeguranca(), request.nextUrl);
  const csp = cabecalhos['Content-Security-Policy'] ?? cabecalhos['Content-Security-Policy-Report-Only'];

  const pedido = new Headers(request.headers);
  pedido.set('x-nonce', nonce);
  pedido.set('Content-Security-Policy', csp);

  const resposta = NextResponse.next({ request: { headers: pedido } });
  for (const [nome, valor] of Object.entries(cabecalhos)) resposta.headers.set(nome, valor);
  return resposta;
}

export const config = {
  matcher: [
    {
      // Páginas. Fora: API (cabeçalhos próprios no next.config), arquivos do build, imagens otimizadas,
      // ícones, robots e sitemap; e o prefetch do next/link (não é documento).
      source: '/((?!api|_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
