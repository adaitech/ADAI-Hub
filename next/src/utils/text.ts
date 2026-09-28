/** Quebra um texto do Strapi por Enter, removendo espaços e linhas vazias. */
export function splitLines(text: string | null | undefined): string[] {
  return (text ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}
