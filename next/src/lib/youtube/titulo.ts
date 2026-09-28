/**
 * Leitura dos títulos dos vídeos da ADAI. Formatos reais encontrados no canal:
 *   "Não compre essa briga | Batalhas morais | Pr. Rodrigo Soeiro"   (série | tema | pregador)
 *   "Inimigos Adoráveis - Palavra Torpe | Pra. Tati Soeiro"         (série - tema | pregador)
 *   "Ele Prometeu Paz | Pr. Rodrigo Soeiro"                          (série + tema juntos; a playlist
 *                                                                    "Ele Prometeu" separa)
 *   "Boa Terra | Pra. Carla Hobo"                                    (só série | pregador)
 *   "Culto ao vivo | ADAI On"                                        (culto completo, NÃO é série)
 */

export interface TituloMensagem {
  seriesTitle: string | null;
  topic: string | null;
  speaker: string | null;
}

/** Minúsculas, sem acento e com espaços simples: para comparar, nunca para exibir. */
export function normalizarComparacao(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function limpar(texto: string): string {
  return texto.replace(/\s+/g, ' ').trim();
}

/** Segmentos separados por "|" (inclui a barra "｜" de largura total). */
function segmentos(titulo: string): string[] {
  return titulo
    .split(/[|｜]/)
    .map(limpar)
    .filter(Boolean);
}

const PREFIXOS_PREGADOR = /^(pr|pra|pastor|pastora|ap|apostolo|apostola|bispo|bispa|rev|reverendo|missionario|missionaria|miss|dr|dra|pb|presbitero)\b\.?/;

function pareceNomeDePregador(segmento: string): boolean {
  return PREFIXOS_PREGADOR.test(normalizarComparacao(segmento));
}

/** "Culto ao vivo | ADAI On" (qualquer caixa, acento ou espaçamento): culto completo, não é uma série. */
export function isAdaiLiveService(titulo: string | null | undefined): boolean {
  if (!titulo) return false;
  const [primeiro] = segmentos(titulo);
  return primeiro !== undefined && normalizarComparacao(primeiro).startsWith('culto ao vivo');
}

/** Separa "Série Tema" usando o nome da playlist como dica (palavra a palavra, sem acento/caixa). */
function separarPelaDica(cabeca: string, dica: string): { serie: string; tema: string | null } | null {
  const palavras = cabeca.split(' ');
  const palavrasDica = normalizarComparacao(dica).split(' ');
  if (palavrasDica.length === 0 || palavras.length < palavrasDica.length) return null;
  const inicio = palavras.slice(0, palavrasDica.length).map(normalizarComparacao);
  if (inicio.join(' ') !== palavrasDica.join(' ')) return null;
  const tema = limpar(palavras.slice(palavrasDica.length).join(' ').replace(/^[-–—:]\s*/, ''));
  return { serie: palavras.slice(0, palavrasDica.length).join(' '), tema: tema || null };
}

/**
 * Título de mensagem → série, tema e pregador. Nunca lança: título fora do padrão vira
 * `{ seriesTitle: <título>, topic: null, speaker: null }`.
 * @param dicaSerie nome da playlist, para separar títulos sem separador ("Ele Prometeu Paz").
 */
export function parseSermonTitle(titulo: string | null | undefined, dicaSerie?: string | null): TituloMensagem {
  const partes = segmentos(titulo ?? '');
  if (partes.length === 0) return { seriesTitle: null, topic: null, speaker: null };

  let cabeca = partes[0];
  let topic: string | null = null;
  let speaker: string | null = null;

  if (partes.length >= 3) {
    speaker = partes[partes.length - 1];
    topic = partes.slice(1, -1).join(' | ');
  } else if (partes.length === 2) {
    if (pareceNomeDePregador(partes[1])) speaker = partes[1];
    else topic = partes[1];
  }

  if (!topic) {
    const traco = cabeca.match(/^(.+?)\s+[-–—]\s+(.+)$/);
    if (traco) {
      cabeca = limpar(traco[1]);
      topic = limpar(traco[2]);
    } else if (dicaSerie) {
      const separado = separarPelaDica(cabeca, limpar(dicaSerie));
      if (separado) {
        cabeca = separado.serie;
        topic = separado.tema;
      }
    }
  }

  return { seriesTitle: cabeca || null, topic, speaker };
}
