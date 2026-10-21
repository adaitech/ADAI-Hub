import type { ListaTestesData, ListaTestesView } from './types';

/** Configuração da lista. Sem título → null. Atalhos ligados, salvo `false` explícito. */
export function normalizeListaTestes(data: ListaTestesData): ListaTestesView | null {
  const titulo = data.titulo?.trim();
  if (!titulo) return null;
  const textoApoio = data.texto_apoio?.trim();
  return {
    titulo,
    ...(textoApoio ? { textoApoio } : {}),
    atalhos: data.mostrar_atalhos !== false,
  };
}
