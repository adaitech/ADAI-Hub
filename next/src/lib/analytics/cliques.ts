import type { EventosAnalytics, NomeEvento } from './eventos';

/**
 * Regras de clique → eventos (sem DOM, testável). O ouvinte global (`RastreadorAnalytics`)
 * coleta o contexto do elemento clicado e esta função decide os eventos. Assim as seções
 * continuam Server Components: não precisam de `onClick` nem de `'use client'`.
 */
export interface ContextoClique {
  /** `data-section` mais próximo, `header` ou `footer`. */
  secao: string;
  /** Texto visível (ou `aria-label`) do link/botão, sem "(abre em nova aba)". */
  texto: string;
  /** `href` absoluto do link; vazio para botões. */
  destino: string;
  /** Título do card/item da lista onde o clique aconteceu (ex.: nome da unidade, do evento). */
  card: string | null;
  /** Título (h1) da página: nas páginas de unidade, o nome da unidade. */
  pagina?: string | null;
}

export type EventoGerado = { [N in NomeEvento]: [N, EventosAnalytics[N]] }[NomeEvento];

function url(destino: string): URL | null {
  try {
    return destino ? new URL(destino) : null;
  } catch {
    return null;
  }
}

function ehGoogleMaps(u: URL | null): boolean {
  if (!u) return false;
  if (u.hostname === 'maps.app.goo.gl') return true;
  if (u.hostname === 'goo.gl') return u.pathname.startsWith('/maps');
  return /(^|\.)google\.[a-z.]+$/.test(u.hostname) && u.pathname.startsWith('/maps');
}

/** Destino sem dado pessoal: http(s) sem query string; e-mail/telefone só o tipo (`mailto:`, `tel:`). */
function destinoSeguro(u: URL | null, destino: string): string {
  if (!u) return destino;
  return /^https?:$/.test(u.protocol) ? `${u.origin}${u.pathname}` : u.protocol;
}

export function eventosDoClique({ secao, texto, destino, card, pagina = null }: ContextoClique): EventoGerado[] {
  const u = url(destino);
  const caminho = u?.pathname ?? '';
  const eventos: EventoGerado[] = [];

  if (caminho.startsWith('/planeje-sua-visita') || /planej\w* (sua )?visita/i.test(texto)) {
    eventos.push(['planejar_visita', { origem: secao, texto }]);
  }
  if (ehGoogleMaps(u) || /como chegar/i.test(texto)) {
    // Card de unidade (Neste domingo, Outras unidades) → título do card. Fora dele (Hero ou o card
    // "Como chegar" da página da unidade) → título da página, que é o nome da unidade.
    const cardDeUnidade = card && !/^como chegar$/i.test(card) ? card : null;
    eventos.push(['como_chegar', { origem: secao, unidade: cardDeUnidade ?? pagina ?? card ?? texto }]);
  }
  if (caminho.startsWith('/contribua') || /contribu|d[ií]zimo|ofert|doa[cç]/i.test(texto)) {
    eventos.push(['contribuir', { origem: secao, texto }]);
  }
  if (u?.hostname === 'apps.apple.com') eventos.push(['baixar_app', { origem: secao, loja: 'app_store' }]);
  if (u?.hostname === 'play.google.com') eventos.push(['baixar_app', { origem: secao, loja: 'google_play' }]);
  if (secao === 'proximos-eventos' && card) {
    eventos.push(['selecionar_evento', { evento: card, acao: texto }]);
  }
  if (secao === 'ministerios' && card) {
    eventos.push(['selecionar_ministerio', { ministerio: card }]);
  }
  if (secao === 'serie-atual' && u && /(^|\.)youtube\.com$/.test(u.hostname) && u.pathname === '/playlist') {
    eventos.push(['ver_todas_mensagens', { origem: secao, serie: card ?? '' }]);
  }

  // Base de todo clique (permite análises novas no GA4 sem deploy).
  eventos.push(['clique_cta', { origem: secao, texto, destino: destinoSeguro(u, destino) }]);
  return eventos;
}
