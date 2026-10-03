/**
 * Formato de um objeto: os caminhos das chaves (`conteudos[].video.embedUrl`), sem os valores.
 * Usado para perceber quando o formato de um resultado guardado em cache mudou.
 */
export function formatoDe(valor: unknown, caminho = ''): string[] {
  if (Array.isArray(valor)) {
    return valor.length === 0 ? [`${caminho}[]`] : [...new Set(valor.flatMap((item) => formatoDe(item, `${caminho}[]`)))].sort();
  }
  if (valor !== null && typeof valor === 'object') {
    return Object.entries(valor)
      .flatMap(([chave, filho]) => formatoDe(filho, caminho ? `${caminho}.${chave}` : chave))
      .sort();
  }
  return [caminho];
}
