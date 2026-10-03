/**
 * Catálogo de eventos do DataLayer (plano de medição: `docs/analytics.md`).
 * Todo evento novo entra AQUI primeiro: nome GA4 (snake_case, ≤ 40 caracteres) e parâmetros.
 * Os nomes viram gatilhos no GTM e os parâmetros viram dimensões no GA4 — renomear quebra relatórios.
 * Não vem do Strapi: só dev/IA criam eventos (regra "Medição" do AGENTS.md).
 */

/** Onde o clique aconteceu: `data-section` da seção (`hero`, `serie-atual`…), `header` ou `footer`. */
type Origem = { origem: string };

export interface EventosAnalytics {
  /** Conversão: clique para planejar a visita (link para `/planeje-sua-visita`). */
  planejar_visita: Origem & { texto: string };
  /** Clique em "Como chegar" (Google Maps) de uma unidade. */
  como_chegar: Origem & { unidade: string };
  /** Abriu uma mensagem da Série atual (player no site ou YouTube). */
  assistir_mensagem: Origem & {
    serie: string;
    parte: number;
    status: 'published' | 'live' | 'waiting-sermon-cut';
    player: 'site' | 'youtube';
  };
  /** "Todas as mensagens" (playlist no YouTube). */
  ver_todas_mensagens: Origem & { serie: string };
  /** Clique no link de um card de Próximos eventos. */
  selecionar_evento: { evento: string; acao: string };
  /** Abriu uma pergunta da FAQ. */
  ver_faq: { pergunta: string };
  /** Clique em um ministério de "Encontre seu lugar". */
  selecionar_ministerio: { ministerio: string };
  /** Conversão: clique para contribuir. */
  contribuir: Origem & { texto: string };
  /** Clique para baixar o app da ADAI. */
  baixar_app: Origem & { loja: 'app_store' | 'google_play' };
  /** Qualquer clique em link ou botão (base para análises que ainda não têm evento próprio). */
  clique_cta: Origem & { texto: string; destino: string };
  /** A seção apareceu na tela (uma vez por página). */
  ver_secao: { secao: string; posicao: number };
  /** Core Web Vitals de usuários reais (CLS × 1000 para caber em inteiro). */
  web_vitals: { metrica: string; valor: number; avaliacao: string };
  /** Escolha no banner de cookies. */
  consentimento_cookies: { escolha: 'aceito' | 'recusado' };
}

export type NomeEvento = keyof EventosAnalytics;

/** Lista para o GTM (gatilho "Evento personalizado" por regex) e para os testes. */
export const NOMES_EVENTOS: NomeEvento[] = [
  'planejar_visita',
  'como_chegar',
  'assistir_mensagem',
  'ver_todas_mensagens',
  'selecionar_evento',
  'ver_faq',
  'selecionar_ministerio',
  'contribuir',
  'baixar_app',
  'clique_cta',
  'ver_secao',
  'web_vitals',
  'consentimento_cookies',
];
