/**
 * Limitador de tentativas em memória (janela deslizante por chave, ex.: IP).
 * Devolve `true` quando a tentativa é permitida. Tentativas negadas não contam.
 * Por instância do servidor: é uma proteção básica, não um limite global.
 */
export function criarLimitador(
  max: number,
  janelaMs: number,
  maxChaves = 10_000,
): (chave: string, agora: number) => boolean {
  const tentativas = new Map<string, number[]>();

  return (chave, agora) => {
    const vigentes = (tentativas.get(chave) ?? []).filter((t) => agora - t < janelaMs);

    if (vigentes.length >= max) {
      tentativas.set(chave, vigentes);
      return false;
    }

    vigentes.push(agora);
    // reinsere para a chave ativa ir ao fim; a mais antiga fica no começo do Map
    tentativas.delete(chave);
    tentativas.set(chave, vigentes);

    if (tentativas.size > maxChaves) {
      const maisAntiga = tentativas.keys().next().value;
      if (maisAntiga !== undefined) tentativas.delete(maisAntiga);
    }
    return true;
  };
}

/**
 * IP do cliente para a chave do limitador, a partir do `x-forwarded-for`. Lê da direita para a
 * esquerda: cada proxy confiável (ingress, Front Door…) acrescenta um item no fim, e o que vem antes
 * deles pode ter sido escrito pelo próprio cliente. Com `proxiesConfiaveis` = 1 (padrão), usa o último
 * item. Isso vale tanto se o proxy substitui o cabeçalho quanto se ele acrescenta.
 */
export function ipDoCliente(xff: string | null | undefined, proxiesConfiaveis: number): string {
  const itens = (xff ?? '').split(',').map((item) => item.trim()).filter(Boolean);
  if (itens.length === 0) return 'local';
  const saltos = Number.isInteger(proxiesConfiaveis) && proxiesConfiaveis >= 1 ? proxiesConfiaveis : 1;
  return itens[Math.max(itens.length - saltos, 0)];
}
