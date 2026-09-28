import type { ControleInfo, ShowcaseEntry, ValoresControles } from './types';

type Params = Record<string, string | string[] | undefined>;

/** Metadados dos controles sem as funções (vão para o componente cliente das abas). */
export function controlesInfo(entry: ShowcaseEntry): ControleInfo[] {
  return (entry.controles ?? []).map((c) =>
    c.tipo === 'alternar'
      ? { id: c.id, rotulo: c.rotulo, ajuda: c.ajuda, tipo: c.tipo }
      : { id: c.id, rotulo: c.rotulo, ajuda: c.ajuda, tipo: c.tipo, opcoes: c.opcoes },
  );
}

/** Estado de cada controle na variação original (valor inicial das chaves). */
export function valoresPadrao(entry: ShowcaseEntry, data: unknown): ValoresControles {
  return Object.fromEntries((entry.controles ?? []).map((c) => [c.id, c.valor(data)]));
}

/** Lê os controles da URL do preview. Valores desconhecidos são ignorados. */
export function lerValores(entry: ShowcaseEntry, params: Params): ValoresControles {
  const valores: ValoresControles = {};
  for (const c of entry.controles ?? []) {
    const bruto = params[c.id];
    const valor = Array.isArray(bruto) ? bruto[0] : bruto;
    if (valor === undefined) continue;
    if (c.tipo === 'alternar' && (valor === '1' || valor === '0')) valores[c.id] = valor === '1';
    if (c.tipo === 'opcoes' && c.opcoes.some((o) => o.valor === valor)) valores[c.id] = valor;
  }
  return valores;
}

/** Aplica, na ordem declarada, só os controles que mudam o estado atual do JSON. */
export function aplicarControles(entry: ShowcaseEntry, data: unknown, valores: ValoresControles): unknown {
  let atual = data;
  for (const c of entry.controles ?? []) {
    const valor = valores[c.id];
    if (valor === undefined || valor === c.valor(atual)) continue;
    atual = c.tipo === 'alternar' ? c.aplicar(atual, valor === true) : c.aplicar(atual, String(valor));
  }
  return atual;
}

/** Query string do preview com os controles que diferem do padrão da variação. */
export function queryDosControles(valores: ValoresControles, padrao: ValoresControles): string {
  const params = new URLSearchParams();
  for (const [id, valor] of Object.entries(valores)) {
    if (valor === padrao[id]) continue;
    params.set(id, typeof valor === 'boolean' ? (valor ? '1' : '0') : valor);
  }
  return params.toString();
}
